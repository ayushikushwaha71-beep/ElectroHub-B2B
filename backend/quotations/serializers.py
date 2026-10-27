"""ElectroHub — Quotation Maker Serializers"""

from rest_framework import serializers
from .models import (
    RFQ, Quotation, NegotiationEntry,
    QuotationApproval, ApprovalEntry,
    PurchaseOrder, POIssueEntry,
    Invoice, InvoiceLogEntry,
    VendorNotifyLog,
    QuotationItem,
    Payment, PaymentMethod, PaymentStatus,
    Shipment, ShipmentStatus,
)


# ── NegotiationEntry ──────────────────────────────────────────────────────────

class NegotiationEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model  = NegotiationEntry
        fields = ('id', 'by', 'proposed_price', 'message', 'timestamp')
        read_only_fields = ('id', 'timestamp')


# ── QuotationItem ─────────────────────────────────────────────────────────────

class QuotationItemSerializer(serializers.ModelSerializer):
    """Line-item within a quotation — one per product/vendor combination."""
    line_total          = serializers.FloatField(read_only=True)
    line_total_with_tax = serializers.FloatField(read_only=True)
    vendor_name         = serializers.SerializerMethodField()
    product_display     = serializers.SerializerMethodField()

    class Meta:
        model  = QuotationItem
        fields = (
            'id', 'quotation',
            'product', 'product_name', 'product_display',
            'vendor', 'vendor_name', 'vendor_quote_ref',
            'quantity', 'unit_price', 'discount_pct', 'tax_pct',
            'availability_qty', 'available_from',
            'hsn_code', 'notes',
            'line_total', 'line_total_with_tax',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'line_total', 'line_total_with_tax',
            'vendor_name', 'product_display',
            'created_at', 'updated_at',
        )

    def get_vendor_name(self, obj):
        if obj.vendor:
            return obj.vendor.business_name
        return None

    def get_product_display(self, obj):
        if obj.product:
            return {'id': obj.product.id, 'name': obj.product.name, 'sku': obj.product.sku}
        return None


class QuotationItemCreateSerializer(serializers.ModelSerializer):
    """Write serializer for creating / updating a QuotationItem."""
    class Meta:
        model  = QuotationItem
        fields = (
            'quotation',
            'product', 'product_name',
            'vendor', 'vendor_quote_ref',
            'quantity', 'unit_price', 'discount_pct', 'tax_pct',
            'availability_qty', 'available_from',
            'hsn_code', 'notes',
        )

    def validate(self, attrs):
        if not attrs.get('product_name', '').strip():
            product = attrs.get('product')
            if product:
                attrs['product_name'] = product.name
            else:
                raise serializers.ValidationError(
                    {'product_name': 'Provide product_name or link a catalogue product.'}
                )
        return attrs


class VendorQuotationItemSerializer(QuotationItemSerializer):
    """
    Extended serializer for the Vendor Requests page.
    Adds RFQ-level context (customer name, delivery location, required_by_date,
    quotation status, quotation_number) so the vendor gets a complete picture
    without needing extra API calls.
    """
    quotation_number    = serializers.CharField(source='quotation.quotation_number', read_only=True)
    quotation_status    = serializers.CharField(source='quotation.status',           read_only=True)
    rfq_number          = serializers.CharField(source='quotation.rfq.rfq_number',   read_only=True)
    required_by_date    = serializers.DateField(source='quotation.rfq.required_by_date', read_only=True)
    delivery_location   = serializers.CharField(source='quotation.rfq.delivery_location', read_only=True)
    customer_name       = serializers.SerializerMethodField()
    customer_email      = serializers.SerializerMethodField()
    rfq_technical_specs = serializers.CharField(source='quotation.rfq.technical_specs', read_only=True)
    rfq_additional_notes = serializers.CharField(source='quotation.rfq.additional_notes', read_only=True)

    class Meta(QuotationItemSerializer.Meta):
        fields = QuotationItemSerializer.Meta.fields + (
            'quotation_number', 'quotation_status',
            'rfq_number', 'required_by_date', 'delivery_location',
            'customer_name', 'customer_email',
            'rfq_technical_specs', 'rfq_additional_notes',
        )

    def get_customer_name(self, obj):
        try:
            return obj.quotation.rfq.customer.get_full_name() or obj.quotation.rfq.customer.email
        except Exception:
            return None

    def get_customer_email(self, obj):
        try:
            return obj.quotation.rfq.customer.email
        except Exception:
            return None

# ── RFQ ───────────────────────────────────────────────────────────────────────


class RFQSerializer(serializers.ModelSerializer):
    """Customer-facing RFQ serializer (read + create)."""
    customer_name  = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True, allow_null=True)
    product_name   = serializers.CharField(read_only=True)  # property
    has_quotation  = serializers.SerializerMethodField()

    class Meta:
        model  = RFQ
        fields = (
            'id', 'rfq_number', 'customer', 'customer_name', 'customer_email', 'customer_phone',
            'product_type', 'product', 'custom_product_name', 'reference_url',
            'product_name',
            'quantity', 'required_by_date', 'delivery_location',
            'budget', 'technical_specs', 'additional_notes',
            'status', 'submitted_at', 'updated_at',
            'has_quotation',
        )
        read_only_fields = (
            'id', 'rfq_number', 'customer',
            'status', 'submitted_at', 'updated_at', 'has_quotation',
        )

    def get_has_quotation(self, obj):
        return hasattr(obj, 'quotation')


class RFQCreateSerializer(serializers.ModelSerializer):
    """Write-only serializer for customer submitting an RFQ."""
    class Meta:
        model  = RFQ
        fields = (
            'product_type', 'product', 'custom_product_name', 'reference_url',
            'quantity', 'required_by_date', 'delivery_location',
            'budget', 'technical_specs', 'additional_notes',
        )

    def validate(self, attrs):
        if attrs.get('product_type') == 'existing' and not attrs.get('product'):
            raise serializers.ValidationError(
                {'product': 'Please select a product for an existing-product RFQ.'}
            )
        if attrs.get('product_type') == 'custom' and not attrs.get('custom_product_name', '').strip():
            raise serializers.ValidationError(
                {'custom_product_name': 'Please provide a product name for a custom RFQ.'}
            )
        return attrs

    def create(self, validated_data):
        return RFQ.objects.create(
            customer=self.context['request'].user,
            **validated_data,
        )


# ── Approval ──────────────────────────────────────────────────────────────────

class ApprovalEntrySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model  = ApprovalEntry
        fields = ('id', 'approver_role', 'action', 'remarks', 'actor_name', 'timestamp')

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.email
        return 'System'


class QuotationApprovalSerializer(serializers.ModelSerializer):
    entries = ApprovalEntrySerializer(many=True, read_only=True)

    class Meta:
        model  = QuotationApproval
        fields = ('id', 'quotation', 'approval_status', 'entries', 'created_at', 'updated_at')
        read_only_fields = ('id', 'quotation', 'entries', 'created_at', 'updated_at')


# ── Quotation ─────────────────────────────────────────────────────────────────

class QuotationSerializer(serializers.ModelSerializer):
    """Full quotation with nested items and negotiations — customer + admin reads."""
    negotiations  = NegotiationEntrySerializer(many=True, read_only=True)
    items         = QuotationItemSerializer(many=True, read_only=True)
    rfq_number    = serializers.CharField(source='rfq.rfq_number', read_only=True)
    customer_name  = serializers.CharField(
        source='rfq.customer.get_full_name', read_only=True
    )
    customer_email = serializers.EmailField(
        source='rfq.customer.email', read_only=True
    )
    customer_phone = serializers.CharField(
        source='rfq.customer.phone', read_only=True, allow_null=True
    )
    grand_total    = serializers.FloatField(read_only=True)
    paid_amount    = serializers.SerializerMethodField()
    pending_amount = serializers.SerializerMethodField()
    approval       = QuotationApprovalSerializer(read_only=True)
    invoice        = serializers.SerializerMethodField()

    class Meta:
        model  = Quotation
        fields = (
            'id', 'quotation_number', 'rfq', 'rfq_number',
            'customer_name', 'customer_email', 'customer_phone',
            'product_name', 'product_type',
            'quantity', 'unit_price', 'discount_pct', 'tax_pct', 'shipping_charge',
            'delivery_location', 'expected_delivery', 'valid_until',
            'available_qty', 'reserved_qty', 'incoming_qty', 'eta',
            'terms_notes',
            'status',
            'grand_total',
            'paid_amount',
            'pending_amount',
            'items',
            'negotiations',
            'approval',
            'invoice',
            'sent_at', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'quotation_number', 'rfq_number',
            'customer_name', 'customer_email', 'customer_phone',
            'grand_total', 'items', 'negotiations', 'approval', 'invoice',
            'sent_at', 'created_at', 'updated_at',
        )

    def get_invoice(self, obj):
        """Return slim invoice snapshot; None if not yet created."""
        try:
            return InvoiceSummarySerializer(obj.invoice).data
        except Exception:
            return None

    def get_paid_amount(self, obj):
        try:
            payments = obj.invoice.payments.filter(status='confirmed')
            return float(sum(p.amount for p in payments))
        except Exception:
            return 0.0

    def get_pending_amount(self, obj):
        return max(0.0, float(obj.grand_total) - self.get_paid_amount(obj))


class QuotationCreateSerializer(serializers.ModelSerializer):
    """Admin-only: create or update a quotation header."""
    class Meta:
        model  = Quotation
        fields = (
            'rfq',
            'product_name', 'product_type',
            'quantity', 'unit_price', 'discount_pct', 'tax_pct', 'shipping_charge',
            'delivery_location', 'expected_delivery', 'valid_until',
            'available_qty', 'reserved_qty', 'incoming_qty', 'eta',
            'terms_notes',
        )

    def validate_rfq(self, rfq):
        # Prevent creating a second quotation for the same RFQ
        if self.instance is None and hasattr(rfq, 'quotation'):
            raise serializers.ValidationError(
                'A quotation already exists for this RFQ. Edit the existing one.'
            )
        return rfq


# ── PurchaseOrder ─────────────────────────────────────────────────────────────

class POIssueEntrySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model  = POIssueEntry
        fields = ('id', 'action', 'actor_name', 'notes', 'timestamp')

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.email
        return 'System'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    log            = POIssueEntrySerializer(many=True, read_only=True)
    quotation_data = QuotationSerializer(source='quotation', read_only=True)
    shipment       = serializers.SerializerMethodField()

    class Meta:
        model  = PurchaseOrder
        fields = ('id', 'po_number', 'quotation', 'quotation_data', 'status', 'issued_at', 'log', 'created_at', 'shipment')
        read_only_fields = ('id', 'po_number', 'quotation_data', 'issued_at', 'log', 'created_at', 'shipment')

    def get_shipment(self, obj):
        try:
            if hasattr(obj, 'shipment') and obj.shipment:
                from .serializers import ShipmentSerializer
                return ShipmentSerializer(obj.shipment).data
        except Exception:
            pass
        return None


# ── Invoice ───────────────────────────────────────────────────────────────────

class InvoiceLogEntrySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model  = InvoiceLogEntry
        fields = ('id', 'action', 'actor_name', 'notes', 'timestamp')

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.email
        return 'System'


class InvoiceSummarySerializer(serializers.ModelSerializer):
    """Slim invoice snapshot embedded inside QuotationSerializer (avoids circular nesting)."""
    class Meta:
        model  = Invoice
        fields = (
            'id', 'invoice_number', 'status', 'is_proforma',
            'due_date', 'gstin_buyer', 'hsn_code',
            'paid_at', 'utr_number',
            'created_at', 'updated_at',
        )


class InvoiceSerializer(serializers.ModelSerializer):
    log            = InvoiceLogEntrySerializer(many=True, read_only=True)
    quotation_data = QuotationSerializer(source='quotation', read_only=True)
    grand_total    = serializers.FloatField(source='quotation.grand_total', read_only=True)

    class Meta:
        model  = Invoice
        fields = (
            'id', 'invoice_number', 'quotation', 'quotation_data', 'purchase_order',
            'status', 'is_proforma', 'due_date', 'gstin_buyer', 'hsn_code',
            'paid_at', 'utr_number',
            'grand_total', 'log',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'invoice_number', 'quotation_data',
            'paid_at', 'log',
            'grand_total', 'created_at', 'updated_at',
        )


# ── Payment ───────────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    """Dedicated payment record linked to an invoice."""
    submitted_by_name = serializers.SerializerMethodField()
    confirmed_by_name = serializers.SerializerMethodField()
    invoice_number    = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model  = Payment
        fields = (
            'id', 'invoice', 'invoice_number',
            'amount', 'payment_method', 'utr_reference', 'payment_date',
            'status',
            'submitted_by_name', 'confirmed_by_name', 'confirmed_at',
            'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'invoice_number',
            'submitted_by_name', 'confirmed_by_name', 'confirmed_at',
            'status',
            'created_at', 'updated_at',
        )

    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return obj.submitted_by.get_full_name() or obj.submitted_by.email
        return None

    def get_confirmed_by_name(self, obj):
        if obj.confirmed_by:
            return obj.confirmed_by.get_full_name() or obj.confirmed_by.email
        return None


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Customer / admin: submit a new payment against an invoice."""
    class Meta:
        model  = Payment
        fields = (
            'invoice',
            'amount', 'payment_method', 'utr_reference', 'payment_date',
            'notes',
        )


# ── Shipment ──────────────────────────────────────────────────────────────────

class ShipmentSerializer(serializers.ModelSerializer):
    """Logistics / dispatch tracking for a PurchaseOrder."""
    po_number      = serializers.CharField(source='purchase_order.po_number', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = Shipment
        fields = (
            'id', 'purchase_order', 'po_number',
            'carrier', 'tracking_number', 'tracking_url',
            'dispatched_at', 'expected_delivery', 'delivered_at',
            'status',
            'created_by_name', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'po_number', 'created_by_name',
            'created_at', 'updated_at',
        )

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return 'System'


class ShipmentCreateSerializer(serializers.ModelSerializer):
    """Admin: create or update a shipment record for a PO."""
    class Meta:
        model  = Shipment
        fields = (
            'purchase_order',
            'carrier', 'tracking_number', 'tracking_url',
            'dispatched_at', 'expected_delivery',
            'status', 'notes',
        )


# ── VendorNotifyLog ───────────────────────────────────────────────────────────

class VendorNotifyLogSerializer(serializers.ModelSerializer):
    vendor_name  = serializers.CharField(source='vendor.business_name', read_only=True)
    vendor_email = serializers.EmailField(source='vendor.user.email', read_only=True)
    sent_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = VendorNotifyLog
        fields = (
            'id', 'quotation', 'vendor', 'vendor_name', 'vendor_email',
            'message_subject', 'message_body', 'sent_at', 'sent_by_name',
        )

    def get_sent_by_name(self, obj):
        if obj.sent_by:
            return obj.sent_by.get_full_name() or obj.sent_by.email
        return 'System'
