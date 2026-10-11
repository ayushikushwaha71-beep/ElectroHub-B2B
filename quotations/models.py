"""
ElectroHub — Quotation Maker Models
Full B2B workflow: RFQ → Quotation → Approval Chain → PO → Invoice
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


# ── Shared choice tuples ──────────────────────────────────────────────────────

class RFQStatus(models.TextChoices):
    SUBMITTED       = 'submitted',       'Submitted'
    UNDER_REVIEW    = 'under_review',    'Under Review'
    QUOTED          = 'quoted',          'Quoted'
    ACCEPTED        = 'accepted',        'Accepted'
    REJECTED        = 'rejected',        'Rejected'
    PAYMENT_PENDING = 'payment_pending', 'Payment Pending'
    ORDER_PLACED    = 'order_placed',    'Order Placed'


class QuotationStatus(models.TextChoices):
    DRAFT              = 'draft',              'Draft'
    SENT               = 'sent',              'Sent'
    VIEWED             = 'viewed',             'Viewed'
    NEGOTIATING        = 'negotiating',        'Negotiating'
    REVISED            = 'revised',            'Revised'
    ACCEPTED           = 'accepted',           'Accepted'
    REJECTED           = 'rejected',           'Rejected'
    INVOICE_SENT       = 'invoice_sent',       'Invoice Sent'
    PARTIALLY_PAID     = 'partially_paid',     'Partially Paid'
    PAYMENT_CONFIRMED  = 'payment_confirmed',  'Payment Confirmed'


class ApprovalStatus(models.TextChoices):
    HOD_REVIEW        = 'hod_review',        'Awaiting HOD'
    DIRECTOR_REVIEW   = 'director_review',   'Awaiting Director'
    ACCOUNTANT_REVIEW = 'accountant_review', 'Awaiting Accountant'
    PO_READY          = 'po_ready',          'PO Ready'
    REJECTED          = 'rejected',          'Rejected'


class POStatus(models.TextChoices):
    PENDING      = 'pending',      'Pending Issuance'
    ISSUED       = 'issued',       'PO Issued'
    ACKNOWLEDGED = 'acknowledged', 'Acknowledged'
    ACCEPTED     = 'accepted',     'Accepted'
    REJECTED     = 'rejected',     'Rejected'
    PROCESSING   = 'processing',   'Processing'


class InvoiceStatus(models.TextChoices):
    DRAFT              = 'draft',              'Draft'
    SENT               = 'sent',              'Invoice Sent'
    PARTIALLY_PAID     = 'partially_paid',     'Partially Paid'
    PAYMENT_CONFIRMED  = 'payment_confirmed', 'Payment Confirmed'


# ─────────────────────────────────────────────────────────────────────────────
# RFQ — Request for Quotation (customer-submitted)
# ─────────────────────────────────────────────────────────────────────────────

class RFQ(models.Model):
    rfq_number        = models.CharField(max_length=30, unique=True, editable=False)
    customer          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='rfqs',
    )
    product_type      = models.CharField(
        max_length=10,
        choices=[('existing', 'Existing Product'), ('custom', 'Custom / External')],
        default='existing',
    )
    # If product_type == 'existing', link to the catalogue product (nullable for custom)
    product           = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='rfqs',
    )
    custom_product_name = models.CharField(max_length=300, blank=True)
    reference_url       = models.URLField(max_length=500, blank=True)

    quantity           = models.PositiveIntegerField()
    required_by_date   = models.DateField()
    delivery_location  = models.CharField(max_length=300)
    budget             = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    technical_specs    = models.TextField(blank=True)
    additional_notes   = models.TextField(blank=True)

    status             = models.CharField(
        max_length=20,
        choices=RFQStatus.choices,
        default=RFQStatus.SUBMITTED,
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'rfqs'
        ordering  = ['-submitted_at']

    def save(self, *args, **kwargs):
        if not self.rfq_number:
            # Auto-generate: RFQ-2026-000001
            year  = timezone.now().year
            count = RFQ.objects.filter(submitted_at__year=year).count() + 1
            self.rfq_number = f'RFQ-{year}-{count:06d}'
        super().save(*args, **kwargs)

    @property
    def product_name(self):
        if self.product_type == 'existing' and self.product:
            return self.product.name
        return self.custom_product_name

    def __str__(self):
        return f'{self.rfq_number} — {self.product_name}'


# ─────────────────────────────────────────────────────────────────────────────
# Quotation — built by admin in response to an RFQ
# ─────────────────────────────────────────────────────────────────────────────

class Quotation(models.Model):
    quotation_number  = models.CharField(max_length=30, unique=True, editable=False)
    rfq               = models.OneToOneField(
        RFQ,
        on_delete=models.PROTECT,
        related_name='quotation',
    )

    product_name  = models.CharField(max_length=300)
    product_type  = models.CharField(
        max_length=10,
        choices=[('existing', 'Existing'), ('custom', 'Custom')],
        default='existing',
    )

    quantity        = models.PositiveIntegerField()
    unit_price      = models.DecimalField(max_digits=12, decimal_places=2)
    discount_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_pct         = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    delivery_location = models.CharField(max_length=300)
    expected_delivery = models.DateField(null=True, blank=True)
    valid_until       = models.DateField(null=True, blank=True)

    # Inventory snapshot (informational, not stock-deducting)
    available_qty = models.PositiveIntegerField(default=0)
    reserved_qty  = models.PositiveIntegerField(default=0)
    incoming_qty  = models.PositiveIntegerField(default=0)
    eta           = models.DateField(null=True, blank=True)

    terms_notes   = models.TextField(blank=True)

    status        = models.CharField(
        max_length=25,
        choices=QuotationStatus.choices,
        default=QuotationStatus.DRAFT,
    )

    created_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='quotations_created',
    )
    sent_at    = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quotations'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            year  = timezone.now().year
            count = Quotation.objects.filter(created_at__year=year).count() + 1
            self.quotation_number = f'QT-{year}-{count:06d}'
        super().save(*args, **kwargs)

    @property
    def grand_total(self):
        sub      = float(self.quantity) * float(self.unit_price)
        disc     = sub * float(self.discount_pct) / 100
        taxable  = sub - disc
        tax      = taxable * float(self.tax_pct) / 100
        return round(taxable + tax + float(self.shipping_charge), 2)

    def __str__(self):
        return f'{self.quotation_number} ({self.status})'


# ─────────────────────────────────────────────────────────────────────────────
# NegotiationEntry — counter-offer thread on a quotation
# ─────────────────────────────────────────────────────────────────────────────

class NegotiationEntry(models.Model):
    BY_CHOICES = [('customer', 'Customer'), ('admin', 'Admin')]

    quotation      = models.ForeignKey(
        Quotation, on_delete=models.CASCADE, related_name='negotiations'
    )
    by             = models.CharField(max_length=10, choices=BY_CHOICES)
    proposed_price = models.DecimalField(max_digits=12, decimal_places=2)
    message        = models.TextField(blank=True)
    timestamp      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'negotiation_entries'
        ordering = ['timestamp']

    def __str__(self):
        return f'Neg on {self.quotation.quotation_number} by {self.by}'


# ─────────────────────────────────────────────────────────────────────────────
# QuotationApproval — 3-level internal approval chain
# ─────────────────────────────────────────────────────────────────────────────

class QuotationApproval(models.Model):
    quotation       = models.OneToOneField(
        Quotation, on_delete=models.CASCADE, related_name='approval'
    )
    approval_status = models.CharField(
        max_length=25,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.HOD_REVIEW,
    )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotation_approvals'

    def __str__(self):
        return f'Approval for {self.quotation.quotation_number}: {self.approval_status}'


class ApprovalEntry(models.Model):
    ROLE_CHOICES   = [('HOD', 'HOD'), ('Director', 'Director'), ('Accountant', 'Accountant')]
    ACTION_CHOICES = [('approved', 'Approved'), ('rejected', 'Rejected')]

    approval      = models.ForeignKey(
        QuotationApproval, on_delete=models.CASCADE, related_name='entries'
    )
    approver_role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    action        = models.CharField(max_length=10, choices=ACTION_CHOICES)
    remarks       = models.TextField(blank=True)
    actor         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approval_actions',
    )
    timestamp     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'approval_entries'
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.approver_role} {self.action} {self.approval.quotation.quotation_number}'


# ─────────────────────────────────────────────────────────────────────────────
# PurchaseOrder
# ─────────────────────────────────────────────────────────────────────────────

class PurchaseOrder(models.Model):
    po_number   = models.CharField(max_length=30, unique=True, editable=False)
    quotation   = models.OneToOneField(
        Quotation, on_delete=models.PROTECT, related_name='purchase_order'
    )
    status      = models.CharField(
        max_length=15,
        choices=POStatus.choices,
        default=POStatus.PENDING,
    )
    issued_at   = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.po_number:
            year  = timezone.now().year
            count = PurchaseOrder.objects.filter(created_at__year=year).count() + 1
            self.po_number = f'PO-{year}-{count:06d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.po_number} ({self.status})'


class POIssueEntry(models.Model):
    ACTION_CHOICES = [
        ('issued', 'Issued'), 
        ('acknowledged', 'Acknowledged'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('processing', 'Processing')
    ]

    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name='log'
    )
    action    = models.CharField(max_length=15, choices=ACTION_CHOICES)
    actor     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    notes     = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'po_issue_entries'
        ordering = ['timestamp']


# ─────────────────────────────────────────────────────────────────────────────
# Invoice
# ─────────────────────────────────────────────────────────────────────────────

class Invoice(models.Model):
    invoice_number = models.CharField(max_length=30, unique=True, editable=False)
    quotation      = models.OneToOneField(
        Quotation, on_delete=models.PROTECT, related_name='invoice'
    )
    purchase_order = models.OneToOneField(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='invoice',
    )

    status         = models.CharField(
        max_length=25,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.DRAFT,
    )
    is_proforma    = models.BooleanField(default=False)

    due_date       = models.DateField(null=True, blank=True)
    gstin_buyer    = models.CharField(max_length=20, blank=True)
    hsn_code       = models.CharField(max_length=20, blank=True, default='8542')

    # Payment recording
    paid_at        = models.DateTimeField(null=True, blank=True)
    utr_number     = models.CharField(max_length=50, blank=True)

    created_by     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='invoices_created',
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year  = timezone.now().year
            count = Invoice.objects.filter(created_at__year=year).count() + 1
            prefix = 'PI' if self.is_proforma else 'INV'
            self.invoice_number = f'{prefix}-{year}-{count:06d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.invoice_number} ({self.status})'


class InvoiceLogEntry(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('sent', 'Sent'),
        ('payment_confirmed', 'Payment Confirmed'),
    ]

    invoice   = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='log')
    action    = models.CharField(max_length=20, choices=ACTION_CHOICES)
    actor     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    notes     = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoice_log_entries'
        ordering = ['timestamp']


# ─────────────────────────────────────────────────────────────────────────────
# VendorNotifyLog
# ─────────────────────────────────────────────────────────────────────────────

class VendorNotifyLog(models.Model):
    quotation       = models.ForeignKey(
        Quotation, on_delete=models.CASCADE, related_name='vendor_notifications'
    )
    vendor          = models.ForeignKey(
        'accounts.VendorProfile',
        on_delete=models.CASCADE,
        related_name='notifications_received',
    )
    message_subject = models.CharField(max_length=300)
    message_body    = models.TextField(blank=True)
    sent_at         = models.DateTimeField(auto_now_add=True)
    sent_by         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='vendor_notifications_sent',
    )

    class Meta:
        db_table = 'vendor_notify_log'
        ordering = ['-sent_at']

    def __str__(self):
        return f'Notify {self.vendor.business_name} for {self.quotation.quotation_number}'


# ─────────────────────────────────────────────────────────────────────────────
# QuotationItem — per-line-item breakdown for multi-product / multi-vendor
#   Kept separate from Quotation so one quotation can cover multiple products
#   sourced from different vendors at different prices.
# ─────────────────────────────────────────────────────────────────────────────

class QuotationItem(models.Model):
    quotation       = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name='items',
    )

    # Product — either a catalogue product or a custom/external item
    product         = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='quotation_items',
    )
    product_name    = models.CharField(
        max_length=300,
        help_text='Copied from product or entered manually for custom items.',
    )

    # Vendor responsible for supplying this line item (nullable for internal)
    vendor          = models.ForeignKey(
        'accounts.VendorProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='quotation_items',
    )
    vendor_quote_ref = models.CharField(
        max_length=100, blank=True,
        help_text='Vendor\'s own reference or quote number for this item.',
    )

    # Quantity & pricing
    quantity        = models.PositiveIntegerField(default=1)
    unit_price      = models.DecimalField(max_digits=12, decimal_places=2)
    discount_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_pct         = models.DecimalField(max_digits=5, decimal_places=2, default=18)

    # Availability snapshot at time of quoting
    availability_qty  = models.PositiveIntegerField(
        default=0,
        help_text='Units available for immediate dispatch.',
    )
    available_from    = models.DateField(
        null=True, blank=True,
        help_text='Earliest date vendor can supply if not immediately available.',
    )

    # Misc
    hsn_code        = models.CharField(max_length=20, blank=True, default='8542')
    notes           = models.TextField(blank=True)

    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotation_items'
        ordering = ['id']

    @property
    def line_total(self):
        """Net line total after discount, before tax."""
        sub  = float(self.quantity) * float(self.unit_price)
        disc = sub * float(self.discount_pct) / 100
        return round(sub - disc, 2)

    @property
    def line_total_with_tax(self):
        taxable = self.line_total
        return round(taxable + taxable * float(self.tax_pct) / 100, 2)

    def __str__(self):
        return f'{self.product_name} × {self.quantity} @ {self.unit_price} [{self.quotation.quotation_number}]'


# ─────────────────────────────────────────────────────────────────────────────
# Payment — dedicated payment record linked to an invoice
#   Replaces the inline utr_number / paid_at fields on Invoice for richer
#   multi-payment and audit trail support.
# ─────────────────────────────────────────────────────────────────────────────

class PaymentMethod(models.TextChoices):
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    NEFT          = 'neft',          'NEFT'
    RTGS          = 'rtgs',          'RTGS'
    IMPS          = 'imps',          'IMPS'
    UPI           = 'upi',           'UPI'
    CHEQUE        = 'cheque',        'Cheque'
    DD            = 'dd',            'Demand Draft'
    LC            = 'lc',            'Letter of Credit'
    OTHERS        = 'others',        'Others'


class PaymentStatus(models.TextChoices):
    PENDING   = 'pending',   'Pending Confirmation'
    CONFIRMED = 'confirmed', 'Confirmed'
    REJECTED  = 'rejected',  'Rejected / Bounced'


class Payment(models.Model):
    invoice         = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='payments',
    )

    amount          = models.DecimalField(max_digits=14, decimal_places=2)
    payment_method  = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER,
    )
    utr_reference   = models.CharField(
        max_length=100, blank=True,
        help_text='UTR / cheque number / transaction reference.',
    )
    payment_date    = models.DateField(
        help_text='Date on which the payment was made by the buyer.',
    )

    status          = models.CharField(
        max_length=15,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    # Who submitted and who confirmed
    submitted_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='payments_submitted',
    )
    confirmed_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='payments_confirmed',
    )
    confirmed_at    = models.DateTimeField(null=True, blank=True)

    notes           = models.TextField(blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment ₹{self.amount} for {self.invoice.invoice_number} ({self.status})'


# ─────────────────────────────────────────────────────────────────────────────
# Shipment — logistics / dispatch tracking linked to a PurchaseOrder
# ─────────────────────────────────────────────────────────────────────────────

class ShipmentStatus(models.TextChoices):
    PROCESSING     = 'processing',    'Processing'
    READY_TO_SHIP  = 'ready_to_ship', 'Ready to Ship'
    SHIPPED        = 'shipped',       'Shipped'
    DELIVERED      = 'delivered',     'Delivered'


class Shipment(models.Model):
    purchase_order    = models.OneToOneField(
        PurchaseOrder,
        on_delete=models.PROTECT,
        related_name='shipment',
    )

    carrier           = models.CharField(max_length=100, blank=True)
    tracking_number   = models.CharField(max_length=100, blank=True)
    tracking_url      = models.URLField(max_length=500, blank=True)

    dispatched_at     = models.DateTimeField(null=True, blank=True)
    expected_delivery = models.DateField(null=True, blank=True)
    delivered_at      = models.DateTimeField(null=True, blank=True)

    status            = models.CharField(
        max_length=15,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PROCESSING,
    )

    # Who created / last updated the shipment record
    created_by        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='shipments_created',
    )

    notes             = models.TextField(blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Shipment for {self.purchase_order.po_number} ({self.status})'

