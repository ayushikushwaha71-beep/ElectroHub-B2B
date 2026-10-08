"""ElectroHub — Quotation Maker URL Configuration"""

from django.urls import path
from . import views

urlpatterns = [
    # ── Customer: RFQ ────────────────────────────────────────────────────────
    path('rfq/',        views.CustomerRFQListCreateView.as_view(), name='rfq-list-create'),
    path('rfq/<int:pk>/', views.CustomerRFQDetailView.as_view(),  name='rfq-detail'),

    # ── Real-time availability check ─────────────────────────────────────────
    path('availability/', views.availability_check, name='availability-check'),

    # ── Customer: Quotation actions ───────────────────────────────────────────
    path('',               views.CustomerQuotationListView.as_view(),   name='quotation-list'),
    path('<int:pk>/',      views.CustomerQuotationDetailView.as_view(), name='quotation-detail'),
    path('<int:pk>/accept/',    views.customer_accept_quotation,    name='quotation-accept'),
    path('<int:pk>/reject/',    views.customer_reject_quotation,    name='quotation-reject'),
    path('<int:pk>/negotiate/', views.customer_negotiate_quotation, name='quotation-negotiate'),
    path('<int:pk>/payment/',   views.customer_record_payment,      name='quotation-payment'),
    path('<int:pk>/invoice/pdf/', views.invoice_pdf_view,           name='quotation-invoice-pdf'),

    # ── Customer: QuotationItem read ──────────────────────────────────────────
    path('<int:pk>/items/', views.QuotationItemListView.as_view(), name='quotation-items'),

    # ── Customer: Payment submit ──────────────────────────────────────────────
    path('<int:pk>/submit-payment/', views.customer_submit_payment, name='quotation-submit-payment'),

    # ── Customer: Shipment status ─────────────────────────────────────────────
    path('<int:pk>/shipment/', views.customer_shipment_status, name='quotation-shipment-status'),

    # ── Vendor: Assigned RFQ / QuotationItem requests ────────────────────────
    path('vendor/requests/',                         views.VendorRequestListView.as_view(), name='vendor-request-list'),
    path('vendor/requests/<int:pk>/',                views.VendorRequestDetailView.as_view(), name='vendor-request-detail'),
    path('vendor/requests/<int:item_pk>/quote/',     views.vendor_submit_quote,              name='vendor-request-quote'),

    # ── Vendor: Full Quotation Builder ────────────────────────────────────────
    path('vendor/quotations/<int:quotation_pk>/',              views.vendor_quotation_detail,         name='vendor-quotation-detail'),
    path('vendor/quotations/<int:quotation_pk>/terms/',        views.vendor_update_quotation_terms,   name='vendor-quotation-terms'),
    path('vendor/quotations/<int:quotation_pk>/items/bulk/',   views.vendor_bulk_update_items,        name='vendor-quotation-items-bulk'),
    path('vendor/quotations/<int:quotation_pk>/submit/',       views.vendor_submit_quotation,         name='vendor-quotation-submit'),
]
