"""ElectroHub — Quotation Maker Admin URL Configuration"""

from django.urls import path
from . import views

urlpatterns = [
    # ── Dashboard ─────────────────────────────────────────────────────────────
    path('dashboard/stats/', views.admin_dashboard_stats, name='admin-dashboard-stats'),

    # ── RFQ management ────────────────────────────────────────────────────────
    path('rfq/',              views.AdminRFQListView.as_view(),     name='admin-rfq-list'),
    path('rfq/<int:pk>/status/', views.admin_update_rfq_status,    name='admin-rfq-status'),

    # ── Quotation builder ─────────────────────────────────────────────────────
    path('quotations/',           views.AdminQuotationListCreateView.as_view(), name='admin-quotation-list-create'),
    path('quotations/<int:pk>/',  views.AdminQuotationDetailView.as_view(),     name='admin-quotation-detail'),
    path('quotations/<int:pk>/send/',      views.admin_send_quotation,          name='admin-quotation-send'),
    path('quotations/<int:pk>/negotiate/', views.admin_counter_negotiate,        name='admin-quotation-negotiate'),

    # ── QuotationItem management ──────────────────────────────────────────────
    path('quotations/<int:pk>/items/',                       views.admin_create_quotation_item,  name='admin-quotation-item-create'),
    path('quotations/<int:pk>/items/<int:item_pk>/',         views.admin_quotation_item_detail,  name='admin-quotation-item-detail'),

    # ── Approval workflow ─────────────────────────────────────────────────────
    path('quotations/<int:pk>/approve/',         views.admin_approve_quotation,             name='admin-quotation-approve'),
    path('quotations/<int:pk>/reject-approval/', views.admin_reject_quotation_approval,     name='admin-quotation-reject-approval'),

    # ── Purchase Order ────────────────────────────────────────────────────────
    path('purchase-orders/',              views.AdminPurchaseOrderListView.as_view(), name='admin-po-list'),
    path('quotations/<int:pk>/po/issue/', views.admin_issue_po,                       name='admin-po-issue'),

    # ── Invoice ───────────────────────────────────────────────────────────────
    path('invoices/',                                    views.AdminInvoiceListView.as_view(),  name='admin-invoice-list'),
    path('quotations/<int:pk>/invoice/create/',          views.admin_create_invoice,            name='admin-invoice-create'),
    path('quotations/<int:pk>/invoice/send/',            views.admin_send_invoice,              name='admin-invoice-send'),
    path('quotations/<int:pk>/invoice/confirm-payment/', views.admin_confirm_invoice_payment,   name='admin-invoice-confirm-payment'),

    # ── Payment ───────────────────────────────────────────────────────────────
    path('payments/',                              views.AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('payments/<int:payment_id>/confirm/',     views.admin_confirm_payment,          name='admin-payment-confirm'),

    # ── Shipment ──────────────────────────────────────────────────────────────
    path('shipments/',                          views.AdminShipmentListView.as_view(),       name='admin-shipment-list'),
    path('purchase-orders/<int:pk>/shipment/',  views.admin_create_or_update_shipment,       name='admin-shipment-create-update'),

    # ── Vendor Notify ─────────────────────────────────────────────────────────
    path('quotations/<int:pk>/vendor-notify/', views.admin_vendor_notify, name='admin-vendor-notify'),
]
