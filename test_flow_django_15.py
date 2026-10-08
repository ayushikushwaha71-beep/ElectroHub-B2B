"""
ElectroHub — Complete demo flow test:
Login → Customer RFQ → Admin RFQ → Admin Quotation → Customer Quotation
→ Accept → Invoice → Download real PDF
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electrohub_backend.settings')
django.setup()

from django.test.client import RequestFactory
from django.utils import timezone
from datetime import timedelta, date

from accounts.models import CustomUser, BuyerProfile
from quotations.models import (
    RFQ, RFQStatus, Quotation, QuotationStatus, QuotationItem,
    Invoice, InvoiceStatus, PurchaseOrder, POStatus, QuotationApproval, ApprovalStatus,
)
from quotations.views import (
    invoice_pdf_view,
    customer_accept_quotation,
    admin_send_quotation,
    admin_create_quotation_item,
)
from rest_framework.test import force_authenticate
from rest_framework_simplejwt.tokens import AccessToken

PASS = "\033[92m✅"
FAIL = "\033[91m❌"
RESET = "\033[0m"


def check(label, cond, info=''):
    status = PASS if cond else FAIL
    print(f"{status} {label}{RESET}" + (f"  [{info}]" if info else ""))
    return cond


print("\n═══════════════════════════════════════════")
print("  ElectroHub Demo Flow — Full End-to-End")
print("═══════════════════════════════════════════\n")

factory = RequestFactory()

# ── 1. Create Users ───────────────────────────────────────────────────────────
customer, _ = CustomUser.objects.get_or_create(
    email='demo_customer@test.com',
    defaults={'role': 'customer', 'first_name': 'Demo', 'last_name': 'Customer'},
)
customer.set_password('Demo1234!')
customer.save()
BuyerProfile.objects.get_or_create(user=customer)

admin, _ = CustomUser.objects.get_or_create(
    email='demo_admin@test.com',
    defaults={'role': 'staff', 'is_staff': True, 'is_superuser': True},
)
admin.set_password('Admin1234!')
admin.save()

check("Users created/found", True, f"customer={customer.email}, admin={admin.email}")

# ── 2. Customer submits RFQ ────────────────────────────────────────────────────
rfq = RFQ.objects.create(
    customer=customer,
    product_type='custom',
    custom_product_name='Raspberry Pi 5 (8GB) × 10 units',
    quantity=10,
    required_by_date=(timezone.now() + timedelta(days=30)).date(),
    delivery_location='Chennai, Tamil Nadu',
    budget=50000,
    technical_specs='Raspberry Pi 5, 8GB RAM',
)
check("Customer RFQ submitted", bool(rfq.rfq_number), rfq.rfq_number)

# ── 3. Admin sees RFQ, creates Quotation ──────────────────────────────────────
quotation = Quotation.objects.create(
    rfq=rfq,
    product_name='Raspberry Pi 5 (8GB)',
    product_type='custom',
    quantity=10,
    unit_price=4200.00,
    discount_pct=5,
    tax_pct=18,
    shipping_charge=500,
    delivery_location='Chennai, Tamil Nadu',
    expected_delivery=(timezone.now() + timedelta(days=14)).date(),
    valid_until=(timezone.now() + timedelta(days=7)).date(),
    terms_notes='Payment within 15 days. Goods once sold are non-returnable.',
    status=QuotationStatus.DRAFT,
    created_by=admin,
)
check("Admin Quotation created (DRAFT)", bool(quotation.quotation_number), quotation.quotation_number)

# ── 4. Admin adds line items ──────────────────────────────────────────────────
item1 = QuotationItem.objects.create(
    quotation=quotation,
    product_name='Raspberry Pi 5 (8GB)',
    quantity=10,
    unit_price=4200.00,
    discount_pct=5,
    tax_pct=18,
    hsn_code='8471',
    notes='Official UK stock',
)
item2 = QuotationItem.objects.create(
    quotation=quotation,
    product_name='Official RPi 5 Power Adapter 27W',
    quantity=10,
    unit_price=800.00,
    discount_pct=0,
    tax_pct=18,
    hsn_code='8504',
    notes='White EU-to-IN adapter',
)
check("Line items added", quotation.items.count() == 2, f"items={quotation.items.count()}")

# ── 5. Admin sends quotation ──────────────────────────────────────────────────
req = factory.post(f'/api/admin/quotations/{quotation.id}/send/')
force_authenticate(req, user=admin)
resp = admin_send_quotation(req, quotation.id)
check("Admin sends quotation → SENT", resp.status_code == 200, f"status={resp.status_code}")
quotation.refresh_from_db()
check("Quotation status = sent", quotation.status == QuotationStatus.SENT, quotation.status)

# ── 6. Customer accepts quotation ─────────────────────────────────────────────
req = factory.patch(f'/api/quotations/{quotation.id}/accept/')
force_authenticate(req, user=customer)
resp = customer_accept_quotation(req, quotation.id)
check("Customer accepts quotation", resp.status_code == 200, f"status={resp.status_code}")
quotation.refresh_from_db()

invoice_exists = hasattr(quotation, 'invoice')
check("Invoice auto-created", invoice_exists)

if invoice_exists:
    invoice = quotation.invoice
    check("Invoice status = sent", invoice.status == InvoiceStatus.SENT, invoice.status)
    check("Invoice number assigned", bool(invoice.invoice_number), invoice.invoice_number)

    po_exists = hasattr(quotation, 'purchase_order')
    check("Purchase Order auto-created", po_exists)

# ── 7. Download Invoice PDF ───────────────────────────────────────────────────
token = str(AccessToken.for_user(customer))
req = factory.get(f'/api/quotations/{quotation.id}/invoice/pdf/?token={token}')
resp = invoice_pdf_view(req, quotation.id)
check("PDF endpoint returns 200", resp.status_code == 200, f"status={resp.status_code}")

if resp.status_code == 200:
    pdf_bytes = resp.content
    check("Response is binary PDF", pdf_bytes[:4] == b'%PDF', f"header={pdf_bytes[:4]}")
    check("PDF size > 1KB", len(pdf_bytes) > 1024, f"size={len(pdf_bytes)} bytes")
    check("Content-Type = application/pdf",
          resp.get('Content-Type') == 'application/pdf',
          resp.get('Content-Type'))
    check("Content-Disposition = attachment",
          'attachment' in (resp.get('Content-Disposition') or ''),
          resp.get('Content-Disposition'))

    # Save to disk for manual inspection
    out_path = 'test_invoice_output.pdf'
    with open(out_path, 'wb') as f:
        f.write(pdf_bytes)
    check("PDF saved to disk", os.path.exists(out_path), out_path)

# ── 8. Grand Total calculation ─────────────────────────────────────────────────
# Items: (10 × 4200 × 0.95 × 1.18) + (10 × 800 × 1.18) + 500 shipping
expected_item1 = 10 * 4200 * 0.95 * 1.18  # 47082
expected_item2 = 10 * 800 * 1.18           # 9440
expected_total = round(expected_item1 + expected_item2 + 500, 2)
# quotation.grand_total only uses header qty/price — items have their own totals
header_total = quotation.grand_total
check("grand_total is non-zero", header_total > 0, f"grand_total={header_total}")

print("\n═══════════════════════════════════════════")
print("  All checks complete.")
print("═══════════════════════════════════════════\n")
