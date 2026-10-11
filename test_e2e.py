import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electrohub_backend.settings')
django.setup()

from django.test import RequestFactory
from django.utils import timezone
from datetime import timedelta
from accounts.models import CustomUser, BuyerProfile, VendorProfile
from quotations.models import (
    RFQ, Quotation, QuotationStatus, QuotationItem, PurchaseOrder,
    Invoice, InvoiceStatus, Shipment, ShipmentStatus, Payment, PaymentStatus
)
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
import json

# Force ascii print to avoid powershell charmap errors
sys.stdout.reconfigure(encoding='utf-8')

results = {}

def check(name, cond, info=""):
    status_str = "PASS" if cond else "FAIL"
    print(f"[{status_str}] {name} {f'({info})' if info else ''}")
    if not cond:
        print(f"  -> ERROR: {name} failed!")
    return cond

def run_qa():
    print("\n--- ElectroHub Demo Flow - Full End-to-End ---")
    
    # 1. Setup Data
    client = APIClient()
    customer, _ = CustomUser.objects.get_or_create(email='demo_customer3@test.com', defaults={'role': 'customer', 'first_name': 'Demo', 'last_name': 'Customer'})
    customer.set_password('Demo1234!')
    customer.save()
    BuyerProfile.objects.get_or_create(user=customer)

    admin, _ = CustomUser.objects.get_or_create(email='demo_admin3@test.com', defaults={'role': 'staff', 'is_staff': True, 'is_superuser': True})
    admin.set_password('Admin1234!')
    admin.save()
    
    vendor, _ = CustomUser.objects.get_or_create(email='demo_vendor3@test.com', defaults={'role': 'vendor', 'first_name': 'Demo', 'last_name': 'Vendor'})
    vendor.set_password('Demo1234!')
    vendor.save()
    vp, _ = VendorProfile.objects.get_or_create(user=vendor, defaults={'business_name': 'Demo Vendor Inc'})
    vp.status = 'approved'
    vp.save()

    # --- Flow Steps ---

    # 1. RFQ
    rfq = RFQ.objects.create(
        customer=customer, product_type='custom', custom_product_name='Test Item', quantity=10,
        required_by_date=(timezone.now() + timedelta(days=30)).date(), delivery_location='Test', budget=50000, technical_specs='Test'
    )
    results['RFQ'] = check("RFQ Submitted", bool(rfq.rfq_number), rfq.rfq_number)

    # 2. Admin creates quotation
    quotation = Quotation.objects.create(
        rfq=rfq, product_name='Test Item', product_type='custom', quantity=10, unit_price=4200.00,
        discount_pct=5, tax_pct=18, shipping_charge=500, delivery_location='Test',
        expected_delivery=(timezone.now() + timedelta(days=14)).date(), valid_until=(timezone.now() + timedelta(days=7)).date(),
        terms_notes='Test terms', status=QuotationStatus.DRAFT, created_by=admin,
    )
    # add vendor item
    QuotationItem.objects.create(quotation=quotation, product_name='Test Item', quantity=10, unit_price=4200.00, tax_pct=18, vendor=vp)
    
    # Send Quotation
    client.force_authenticate(user=admin)
    resp = client.post(f'/api/admin/quotations/{quotation.id}/send/')
    quotation.refresh_from_db()
    results['Quotation'] = check("Quotation Sent", resp.status_code == 200 and quotation.status == QuotationStatus.SENT)

    # 3. Customer Accept
    client.force_authenticate(user=customer)
    resp = client.patch(f'/api/quotations/{quotation.id}/accept/')
    if resp.status_code != 200:
        print("Customer Accept Error:", getattr(resp, 'data', resp.content))
    quotation.refresh_from_db()
    results['Customer Accept'] = check("Customer Accept", resp.status_code == 200 and quotation.status == QuotationStatus.INVOICE_SENT)

    # 4. PO Generation
    po_exists = hasattr(quotation, 'purchase_order')
    results['PO Generation'] = check("PO Generated", po_exists)
    po = quotation.purchase_order

    # 5. Dealer PO Receive
    client.force_authenticate(user=vendor)
    resp = client.get('/api/quotations/vendor/purchase-orders/')
    if resp.status_code != 200:
        print("Dealer PO Receive Error:", getattr(resp, 'data', resp.content))
        po_in_list = False
    else:
        # using 'results' key because of DRF pagination
        po_in_list = any(p['id'] == po.id for p in resp.data.get('results', resp.data))
    results['Dealer PO Receive'] = check("Dealer PO Receive", resp.status_code == 200 and po_in_list)

    # 6. Dealer PO Accept
    resp = client.patch(f'/api/quotations/vendor/purchase-orders/{po.id}/status/', {'status': 'accepted'})
    po.refresh_from_db()
    results['Dealer PO Accept/Reject'] = check("Dealer PO Accept/Reject", resp.status_code == 200 and po.status == 'accepted')

    # 7. Dealer PO Processing
    resp = client.patch(f'/api/quotations/vendor/purchase-orders/{po.id}/status/', {'status': 'processing'})
    po.refresh_from_db()
    results['Dealer PO Processing'] = check("Dealer PO Processing", resp.status_code == 200 and po.status == 'processing')

    # 8. Generate PI
    resp = client.post(f'/api/quotations/vendor/purchase-orders/{po.id}/proforma/')
    if resp.status_code not in [200, 201]:
        print("Generate PI Error:", getattr(resp, 'data', resp.content))
    
    po.refresh_from_db()
    invoice = po.invoice if hasattr(po, 'invoice') else None
    results['PI'] = check("PI", resp.status_code in [200, 201] and invoice and invoice.is_proforma, getattr(invoice, 'invoice_number', ''))

    # 9. Payment
    client.force_authenticate(user=customer)
    grand_total = float(quotation.grand_total)

    resp = client.post(f'/api/quotations/{quotation.id}/submit-payment/', {'amount': grand_total/2, 'utr_reference': 'UTR123', 'payment_method': 'neft', 'payment_date': timezone.now().strftime('%Y-%m-%d')})
    if resp.status_code != 201:
        print("Payment Submit Error:", getattr(resp, 'data', resp.content))
    
    # Admin confirm payment
    client.force_authenticate(user=admin)
    payment = invoice.payments.first()
    if not payment:
        print("No payment found!")
        resp2 = None
    else:
        resp2 = client.post(f'/api/admin/payments/{payment.id}/confirm/', {'action': 'confirm'})
        if resp2.status_code != 200:
            print("Payment Confirm Error:", getattr(resp2, 'data', resp2.content))
    
    invoice.refresh_from_db()
    results['Payment'] = check("Payment", getattr(resp2, 'status_code', 0) == 200 and invoice.status == InvoiceStatus.PARTIALLY_PAID)

    # 10. Shipment
    client.force_authenticate(user=vendor)
    resp = client.post(f'/api/quotations/vendor/purchase-orders/{po.id}/shipment/', {'status': 'ready_to_ship'})
    resp = client.post(f'/api/quotations/vendor/purchase-orders/{po.id}/shipment/', {'status': 'shipped', 'carrier': 'DHL', 'tracking_number': '123'})
    resp = client.post(f'/api/quotations/vendor/purchase-orders/{po.id}/shipment/', {'status': 'delivered'})
    
    shipment = po.shipment if hasattr(po, 'shipment') else None
    results['Shipment'] = check("Shipment", resp.status_code == 200 and shipment and shipment.status == ShipmentStatus.DELIVERED)

    # 11. Final Invoice
    invoice.refresh_from_db()
    results['Final Invoice'] = check("Final Invoice", not invoice.is_proforma and invoice.invoice_number.startswith('INV-'), invoice.invoice_number)

    # 12. PDF
    client.force_authenticate(user=customer)
    token = str(AccessToken.for_user(customer))
    resp = client.get(f'/api/quotations/{quotation.id}/invoice/pdf/?token={token}')
    if resp.status_code != 200:
        print("PDF Error:", getattr(resp, 'data', resp.content))
    results['PDF'] = check("PDF", resp.status_code == 200 and b'<!DOCTYPE html>' in resp.content)
    
    print("\n--- FINAL RESULT SUMMARY ---")
    all_pass = all(results.values())
    print(f"FINAL RESULT: {'PASS' if all_pass else 'FAIL'}")
    print("\nFLOW:")
    for k, v in results.items():
        print(f"{k} - {'PASS' if v else 'FAIL'}")

if __name__ == '__main__':
    run_qa()
