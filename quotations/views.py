"""ElectroHub — Quotation Maker Views (Customer + Admin)"""

from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    RFQ, RFQStatus,
    Quotation, QuotationStatus,
    NegotiationEntry,
    QuotationApproval, ApprovalEntry, ApprovalStatus,
    PurchaseOrder, POStatus, POIssueEntry,
    Invoice, InvoiceStatus, InvoiceLogEntry,
    VendorNotifyLog,
    QuotationItem,
    Payment, PaymentStatus,
    Shipment, ShipmentStatus,
)
from .serializers import (
    RFQSerializer, RFQCreateSerializer,
    QuotationSerializer, QuotationCreateSerializer,
    QuotationApprovalSerializer,
    PurchaseOrderSerializer,
    InvoiceSerializer,
    VendorNotifyLogSerializer,
    NegotiationEntrySerializer,
    QuotationItemSerializer, QuotationItemCreateSerializer,
    VendorQuotationItemSerializer,
    PaymentSerializer, PaymentCreateSerializer,
    ShipmentSerializer, ShipmentCreateSerializer,
)
from accounts.models import VendorProfile



# ── Shared permissions ────────────────────────────────────────────────────────

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user, 'role', '') or ''
        return role.lower() == 'customer'


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.is_admin_user)


class IsVendor(permissions.BasePermission):
    """Approved vendor users only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user, 'role', '') or ''
        if role.lower() != 'vendor':
            return False
        try:
            return request.user.vendor_profile.status == 'approved'
        except Exception:
            return False


# ═════════════════════════════════════════════════════════════════════════════
# CUSTOMER VIEWS
# ═════════════════════════════════════════════════════════════════════════════

# ── RFQ ───────────────────────────────────────────────────────────────────────

class CustomerRFQListCreateView(generics.ListCreateAPIView):
    """GET: customer's own RFQs.  POST: submit a new RFQ."""
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            RFQ.objects
            .filter(customer=self.request.user)
            .select_related('product', 'customer')
            .order_by('-submitted_at')
        )

    def get_serializer_class(self):
        return RFQCreateSerializer if self.request.method == 'POST' else RFQSerializer

    def create(self, request, *args, **kwargs):
        serializer = RFQCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        rfq = serializer.save()
        return Response(RFQSerializer(rfq).data, status=status.HTTP_201_CREATED)


class CustomerRFQDetailView(generics.RetrieveUpdateAPIView):
    """GET: retrieve an RFQ.  PATCH: update a submitted (non-quoted) RFQ."""
    permission_classes = [IsCustomer]
    serializer_class   = RFQSerializer
    http_method_names  = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return RFQ.objects.filter(customer=self.request.user).select_related('product', 'customer')

    def update(self, request, *args, **kwargs):
        partial  = True
        instance = self.get_object()
        # Only allow updates while RFQ hasn't been quoted / accepted / rejected
        locked_statuses = (
            RFQStatus.QUOTED, RFQStatus.ACCEPTED, RFQStatus.REJECTED,
            RFQStatus.PAYMENT_PENDING, RFQStatus.ORDER_PLACED,
        )
        if instance.status in locked_statuses:
            return Response(
                {'detail': f'Cannot edit an RFQ with status "{instance.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = RFQCreateSerializer(instance, data=request.data, partial=partial,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        rfq = serializer.save()
        return Response(RFQSerializer(rfq).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def availability_check(request):
    """Real-time availability check for a catalogue product.
    GET /api/quotations/availability/?product_id=<id>&quantity=<qty>
    Returns: { available, available_qty, can_fulfill, shortfall }
    """
    try:
        product_id = int(request.query_params.get('product_id', 0))
        quantity   = int(request.query_params.get('quantity', 1))
    except (TypeError, ValueError):
        return Response({'detail': 'product_id and quantity must be integers.'}, status=400)

    from products.models import Product
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found.'}, status=404)

    stock = getattr(product, 'stock', 0) or 0
    can_fulfill = stock >= quantity
    return Response({
        'product_id':   product.id,
        'product_name': product.name,
        'available_qty': stock,
        'requested_qty': quantity,
        'can_fulfill':  can_fulfill,
        'shortfall':    max(0, quantity - stock),
        'available':    stock > 0,
    })


# ── Quotation ─────────────────────────────────────────────────────────────────

class CustomerQuotationListView(generics.ListAPIView):
    """GET: all quotations received by the logged-in customer."""
    permission_classes = [IsCustomer]
    serializer_class   = QuotationSerializer

    def get_queryset(self):
        return (
            Quotation.objects
            .filter(rfq__customer=self.request.user)
            .prefetch_related('negotiations')
            .select_related('rfq', 'rfq__customer', 'invoice')
            .order_by('-created_at')
        )


class CustomerQuotationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsCustomer]
    serializer_class   = QuotationSerializer

    def get_queryset(self):
        return (
            Quotation.objects
            .filter(rfq__customer=self.request.user)
            .prefetch_related('negotiations')
            .select_related('rfq', 'rfq__customer', 'invoice')
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark as viewed on first open
        if instance.status == QuotationStatus.SENT:
            instance.status = QuotationStatus.VIEWED
            instance.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(instance).data)


@api_view(['PATCH'])
@permission_classes([IsCustomer])
def customer_accept_quotation(request, pk):
    try:
        quotation = Quotation.objects.get(pk=pk, rfq__customer=request.user)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if quotation.status not in (QuotationStatus.SENT, QuotationStatus.VIEWED, QuotationStatus.NEGOTIATING, QuotationStatus.REVISED):
        return Response({'detail': f'Cannot accept a quotation with status "{quotation.status}".'}, status=400)

    quotation.status = QuotationStatus.INVOICE_SENT
    quotation.save(update_fields=['status', 'updated_at'])

    # Update linked RFQ status
    rfq = quotation.rfq
    rfq.status = RFQStatus.ACCEPTED
    rfq.save(update_fields=['status', 'updated_at'])

    # Auto-create the QuotationApproval as PO_READY to bypass HOD workflow
    QuotationApproval.objects.get_or_create(
        quotation=quotation,
        defaults={'approval_status': ApprovalStatus.PO_READY},
    )
    # Auto-issue PO and create Draft Invoice immediately for seamless flow
    po, _ = PurchaseOrder.objects.get_or_create(
        quotation=quotation,
        defaults={'status': POStatus.ISSUED, 'issued_at': timezone.now()}
    )
    if not hasattr(quotation, 'invoice'):
        pass # Vendor will generate Proforma Invoice manually later

    # Fetch fresh from DB to clear any cached reverse-relations (e.g. .invoice)
    quotation = Quotation.objects.get(pk=pk)
    return Response(QuotationSerializer(quotation).data)


@api_view(['PATCH'])
@permission_classes([IsCustomer])
def customer_reject_quotation(request, pk):
    try:
        quotation = Quotation.objects.get(pk=pk, rfq__customer=request.user)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    quotation.status = QuotationStatus.REJECTED
    quotation.save(update_fields=['status', 'updated_at'])

    rfq = quotation.rfq
    rfq.status = RFQStatus.REJECTED
    rfq.save(update_fields=['status', 'updated_at'])

    return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsCustomer])
def customer_negotiate_quotation(request, pk):
    """Submit a counter-offer on a quotation."""
    try:
        quotation = Quotation.objects.get(pk=pk, rfq__customer=request.user)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if quotation.status not in (QuotationStatus.SENT, QuotationStatus.VIEWED, QuotationStatus.REVISED):
        return Response({'detail': 'Cannot negotiate at current status.'}, status=400)

    proposed_price = request.data.get('proposed_price')
    message        = request.data.get('message', '')

    if not proposed_price:
        return Response({'proposed_price': 'This field is required.'}, status=400)

    NegotiationEntry.objects.create(
        quotation=quotation,
        by='customer',
        proposed_price=proposed_price,
        message=message,
    )
    quotation.status = QuotationStatus.NEGOTIATING
    quotation.save(update_fields=['status', 'updated_at'])

    return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsCustomer])
def customer_record_payment(request, pk):
    """Customer submits UTR after bank transfer."""
    try:
        quotation = Quotation.objects.get(pk=pk, rfq__customer=request.user)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if quotation.status != QuotationStatus.INVOICE_SENT:
        return Response({'detail': 'Payment can only be recorded when invoice is sent.'}, status=400)

    utr = request.data.get('utr_number', '').strip()
    if not utr:
        return Response({'utr_number': 'UTR number is required.'}, status=400)

    # Update invoice
    try:
        invoice = quotation.invoice
        invoice.utr_number  = utr
        invoice.status      = InvoiceStatus.PAYMENT_CONFIRMED
        invoice.paid_at     = timezone.now()
        invoice.save(update_fields=['utr_number', 'status', 'paid_at', 'updated_at'])

        InvoiceLogEntry.objects.create(
            invoice=invoice,
            action='payment_confirmed',
            notes=f'UTR: {utr}',
        )
    except Invoice.DoesNotExist:
        pass

    quotation.status = QuotationStatus.PAYMENT_CONFIRMED
    quotation.save(update_fields=['status', 'updated_at'])

    return Response(QuotationSerializer(quotation).data)


# ═════════════════════════════════════════════════════════════════════════════
# ADMIN VIEWS
# ═════════════════════════════════════════════════════════════════════════════

# ── RFQ Management ────────────────────────────────────────────────────────────

class AdminRFQListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = RFQSerializer

    def get_queryset(self):
        qs = (
            RFQ.objects
            .select_related('product', 'customer')
            .order_by('-submitted_at')
        )
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(rfq_number__icontains=search) | qs.filter(customer__email__icontains=search)
        return qs


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_update_rfq_status(request, pk):
    try:
        rfq = RFQ.objects.get(pk=pk)
    except RFQ.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    new_status = request.data.get('status')
    valid = [s.value for s in RFQStatus]
    if new_status not in valid:
        return Response({'status': f'Valid choices: {valid}'}, status=400)

    rfq.status = new_status
    rfq.save(update_fields=['status', 'updated_at'])
    return Response(RFQSerializer(rfq).data)


# ── Quotation Builder ─────────────────────────────────────────────────────────

class AdminQuotationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = (
            Quotation.objects
            .select_related('rfq', 'rfq__customer')
            .prefetch_related('negotiations')
            .order_by('-created_at')
        )
        approval_status = self.request.query_params.get('approval_status')
        if approval_status:
            qs = qs.filter(approval__approval_status=approval_status)
        q_status = self.request.query_params.get('status')
        if q_status:
            qs = qs.filter(status=q_status)
        return qs

    def get_serializer_class(self):
        return QuotationCreateSerializer if self.request.method == 'POST' else QuotationSerializer

    def create(self, request, *args, **kwargs):
        serializer = QuotationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quotation = serializer.save(created_by=request.user)
        # Update linked RFQ to under_review
        rfq = quotation.rfq
        if rfq.status == RFQStatus.SUBMITTED:
            rfq.status = RFQStatus.UNDER_REVIEW
            rfq.save(update_fields=['status', 'updated_at'])
        return Response(QuotationSerializer(quotation).data, status=status.HTTP_201_CREATED)


class AdminQuotationDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = QuotationSerializer
    queryset           = Quotation.objects.select_related('rfq', 'rfq__customer').prefetch_related('negotiations')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance   = self.get_object()
        serializer = QuotationCreateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        quotation  = serializer.save()
        return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_send_quotation(request, pk):
    """Mark quotation as 'sent' and update linked RFQ to 'quoted'."""
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if quotation.status not in (QuotationStatus.DRAFT, QuotationStatus.REVISED):
        return Response({'detail': f'Cannot send from status "{quotation.status}".'}, status=400)

    quotation.status  = QuotationStatus.SENT
    quotation.sent_at = timezone.now()
    quotation.save(update_fields=['status', 'sent_at', 'updated_at'])

    rfq = quotation.rfq
    rfq.status = RFQStatus.QUOTED
    rfq.save(update_fields=['status', 'updated_at'])

    return Response(QuotationSerializer(quotation).data)


# ── Approval Workflow ─────────────────────────────────────────────────────────

NEXT_APPROVAL_STATUS = {
    ApprovalStatus.HOD_REVIEW:        ApprovalStatus.DIRECTOR_REVIEW,
    ApprovalStatus.DIRECTOR_REVIEW:   ApprovalStatus.ACCOUNTANT_REVIEW,
    ApprovalStatus.ACCOUNTANT_REVIEW: ApprovalStatus.PO_READY,
}

ROLE_FOR_STATUS = {
    ApprovalStatus.HOD_REVIEW:        'HOD',
    ApprovalStatus.DIRECTOR_REVIEW:   'Director',
    ApprovalStatus.ACCOUNTANT_REVIEW: 'Accountant',
}


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_quotation(request, pk):
    try:
        approval = QuotationApproval.objects.select_related('quotation').get(quotation_id=pk)
    except QuotationApproval.DoesNotExist:
        return Response({'detail': 'Approval record not found. Has the customer accepted the quotation?'}, status=404)

    current = approval.approval_status
    if current in (ApprovalStatus.PO_READY, ApprovalStatus.REJECTED):
        return Response({'detail': f'Cannot approve from status "{current}".'}, status=400)

    role    = ROLE_FOR_STATUS.get(current)
    remarks = request.data.get('remarks', '').strip()
    if not remarks:
        return Response({'remarks': 'Remarks are required for approval.'}, status=400)

    ApprovalEntry.objects.create(
        approval=approval,
        approver_role=role,
        action='approved',
        remarks=remarks,
        actor=request.user,
    )

    next_status = NEXT_APPROVAL_STATUS.get(current)
    approval.approval_status = next_status
    approval.save(update_fields=['approval_status', 'updated_at'])

    return Response(QuotationApprovalSerializer(approval).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_quotation_approval(request, pk):
    try:
        approval = QuotationApproval.objects.select_related('quotation').get(quotation_id=pk)
    except QuotationApproval.DoesNotExist:
        return Response({'detail': 'Approval record not found.'}, status=404)

    current = approval.approval_status
    if current in (ApprovalStatus.PO_READY, ApprovalStatus.REJECTED):
        return Response({'detail': f'Cannot reject from status "{current}".'}, status=400)

    role    = ROLE_FOR_STATUS.get(current)
    remarks = request.data.get('remarks', '').strip()
    if not remarks:
        return Response({'remarks': 'Rejection reason is required.'}, status=400)

    ApprovalEntry.objects.create(
        approval=approval,
        approver_role=role,
        action='rejected',
        remarks=remarks,
        actor=request.user,
    )
    approval.approval_status = ApprovalStatus.REJECTED
    approval.save(update_fields=['approval_status', 'updated_at'])

    return Response(QuotationApprovalSerializer(approval).data)


# ── Purchase Order ────────────────────────────────────────────────────────────

class AdminPurchaseOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = PurchaseOrderSerializer

    def get_queryset(self):
        return (
            PurchaseOrder.objects
            .select_related('quotation', 'quotation__rfq', 'quotation__rfq__customer')
            .prefetch_related('log')
            .order_by('-created_at')
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_issue_po(request, pk):
    """Create or issue the PO for a po_ready quotation."""
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    # Ensure approval is PO_READY
    approval = getattr(quotation, 'approval', None)
    if not approval or approval.approval_status != ApprovalStatus.PO_READY:
        return Response({'detail': 'Quotation has not completed the approval chain.'}, status=400)

    po, created = PurchaseOrder.objects.get_or_create(quotation=quotation)
    if po.status != POStatus.PENDING:
        return Response({'detail': f'PO already in status "{po.status}".'}, status=400)

    po.status    = POStatus.ISSUED
    po.issued_at = timezone.now()
    po.save(update_fields=['status', 'issued_at'])

    POIssueEntry.objects.create(
        purchase_order=po,
        action='issued',
        actor=request.user,
        notes=request.data.get('notes', ''),
    )

    return Response(PurchaseOrderSerializer(po).data)


# ── Invoice ───────────────────────────────────────────────────────────────────

class AdminInvoiceListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = InvoiceSerializer

    def get_queryset(self):
        return (
            Invoice.objects
            .select_related('quotation', 'quotation__rfq', 'quotation__rfq__customer', 'purchase_order')
            .prefetch_related('log')
            .order_by('-created_at')
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_invoice(request, pk):
    """Generate an invoice for a quotation whose PO has been issued."""
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if hasattr(quotation, 'invoice'):
        return Response({'detail': 'Invoice already exists for this quotation.'}, status=400)

    po = getattr(quotation, 'purchase_order', None)
    if not po or po.status not in (POStatus.ISSUED, POStatus.ACKNOWLEDGED):
        return Response({'detail': 'A PO must be issued before generating an invoice.'}, status=400)

    invoice = Invoice.objects.create(
        quotation=quotation,
        purchase_order=po,
        status=InvoiceStatus.DRAFT,
        due_date=request.data.get('due_date'),
        gstin_buyer=request.data.get('gstin_buyer', ''),
        hsn_code=request.data.get('hsn_code', '8542'),
        created_by=request.user,
    )
    InvoiceLogEntry.objects.create(
        invoice=invoice,
        action='created',
        actor=request.user,
        notes='Invoice created.',
    )
    return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_send_invoice(request, pk):
    try:
        invoice = Invoice.objects.get(quotation_id=pk)
    except Invoice.DoesNotExist:
        return Response({'detail': 'Invoice not found.'}, status=404)

    if invoice.status != InvoiceStatus.DRAFT:
        return Response({'detail': f'Invoice already in status "{invoice.status}".'}, status=400)

    invoice.status = InvoiceStatus.SENT
    invoice.save(update_fields=['status', 'updated_at'])

    InvoiceLogEntry.objects.create(
        invoice=invoice,
        action='sent',
        actor=request.user,
        notes='Invoice sent to customer.',
    )

    # Update quotation status
    quotation = invoice.quotation
    quotation.status = QuotationStatus.INVOICE_SENT
    quotation.save(update_fields=['status', 'updated_at'])

    return Response(InvoiceSerializer(invoice).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_confirm_invoice_payment(request, pk):
    try:
        invoice = Invoice.objects.get(quotation_id=pk)
    except Invoice.DoesNotExist:
        return Response({'detail': 'Invoice not found.'}, status=404)

    invoice.status  = InvoiceStatus.PAYMENT_CONFIRMED
    invoice.paid_at = timezone.now()
    invoice.utr_number = request.data.get('utr_number', invoice.utr_number)
    invoice.save(update_fields=['status', 'paid_at', 'utr_number', 'updated_at'])

    InvoiceLogEntry.objects.create(
        invoice=invoice,
        action='payment_confirmed',
        actor=request.user,
        notes=request.data.get('notes', 'Payment confirmed by admin.'),
    )

    quotation = invoice.quotation
    quotation.status = QuotationStatus.PAYMENT_CONFIRMED
    quotation.save(update_fields=['status', 'updated_at'])

    rfq = quotation.rfq
    rfq.status = RFQStatus.ORDER_PLACED
    rfq.save(update_fields=['status', 'updated_at'])

    return Response(InvoiceSerializer(invoice).data)


# ── Admin counter-negotiate ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_counter_negotiate(request, pk):
    """Admin sends a revised counter-offer to the customer."""
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    proposed_price = request.data.get('proposed_price')
    message        = request.data.get('message', '')

    if not proposed_price:
        return Response({'proposed_price': 'This field is required.'}, status=400)

    NegotiationEntry.objects.create(
        quotation=quotation,
        by='admin',
        proposed_price=proposed_price,
        message=message,
    )

    # Update quotation unit_price and mark as revised
    quotation.unit_price = proposed_price
    quotation.status     = QuotationStatus.REVISED
    quotation.save(update_fields=['unit_price', 'status', 'updated_at'])

    return Response(QuotationSerializer(quotation).data)


# ── Vendor Notify ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_vendor_notify(request, pk):
    """Dispatch notification to one or more vendors for a po_ready quotation."""
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    vendor_ids = request.data.get('vendor_ids', [])
    if not vendor_ids:
        return Response({'vendor_ids': 'At least one vendor ID is required.'}, status=400)

    message_subject = request.data.get('message_subject', f'Vendor Opportunity — {quotation.quotation_number}')
    message_body    = request.data.get('message_body', '')

    logs = []
    for vid in vendor_ids:
        try:
            vendor = VendorProfile.objects.get(pk=vid, status='approved')
        except VendorProfile.DoesNotExist:
            continue

        log = VendorNotifyLog.objects.create(
            quotation=quotation,
            vendor=vendor,
            message_subject=message_subject,
            message_body=message_body,
            sent_by=request.user,
        )
        logs.append(log)

    return Response(
        VendorNotifyLogSerializer(logs, many=True).data,
        status=status.HTTP_201_CREATED,
    )


# ── Admin Dashboard Stats ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """Quick counts for the admin dashboard stat cards."""
    from orders.models import Order

    data = {
        'total_rfqs':        RFQ.objects.count(),
        'pending_rfqs':      RFQ.objects.filter(status=RFQStatus.SUBMITTED).count(),
        'under_review_rfqs': RFQ.objects.filter(status=RFQStatus.UNDER_REVIEW).count(),
        'quoted_rfqs':       RFQ.objects.filter(status=RFQStatus.QUOTED).count(),

        'total_quotations':     Quotation.objects.count(),
        'pending_approval':     QuotationApproval.objects.filter(
            approval_status__in=[
                ApprovalStatus.HOD_REVIEW,
                ApprovalStatus.DIRECTOR_REVIEW,
                ApprovalStatus.ACCOUNTANT_REVIEW,
            ]
        ).count(),
        'po_ready':             QuotationApproval.objects.filter(
            approval_status=ApprovalStatus.PO_READY
        ).count(),
        'invoices_sent':        Invoice.objects.filter(status=InvoiceStatus.SENT).count(),
        'payments_confirmed':   Invoice.objects.filter(status=InvoiceStatus.PAYMENT_CONFIRMED).count(),

        'total_orders':  Order.objects.count(),
        'pending_orders': Order.objects.filter(status='pending').count(),
    }
    return Response(data)


# ═════════════════════════════════════════════════════════════════════════════
# QUOTATION ITEMS
# ═════════════════════════════════════════════════════════════════════════════

class QuotationItemListView(generics.ListAPIView):
    """GET /api/quotations/<pk>/items/ — list all items for a quotation."""
    serializer_class   = QuotationItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        quotation_id = self.kwargs['pk']
        qs = QuotationItem.objects.filter(
            quotation_id=quotation_id
        ).select_related('product', 'vendor')
        # Customers can only see items for their own quotations
        if not self.request.user.is_admin_user:
            qs = qs.filter(quotation__rfq__customer=self.request.user)
        return qs


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_quotation_item(request, pk):
    """Admin: add a line item to a quotation."""
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Quotation not found.'}, status=404)

    data = request.data.copy()
    data['quotation'] = pk

    serializer = QuotationItemCreateSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    item = serializer.save()
    return Response(QuotationItemSerializer(item).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_quotation_item_detail(request, pk, item_pk):
    """Admin: update or delete a specific QuotationItem."""
    try:
        item = QuotationItem.objects.get(pk=item_pk, quotation_id=pk)
    except QuotationItem.DoesNotExist:
        return Response({'detail': 'Item not found.'}, status=404)

    if request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = QuotationItemCreateSerializer(item, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    item = serializer.save()
    return Response(QuotationItemSerializer(item).data)


# ═════════════════════════════════════════════════════════════════════════════
# PAYMENTS
# ═════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsCustomer])
def customer_submit_payment(request, pk):
    """Customer: submit payment details (UTR etc.) against an invoice."""
    try:
        quotation = Quotation.objects.get(pk=pk, rfq__customer=request.user)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if not hasattr(quotation, 'invoice'):
        return Response({'detail': 'No invoice found for this quotation.'}, status=400)
    
    invoice = quotation.invoice

    data = request.data.copy()
    data['invoice'] = invoice.id

    serializer = PaymentCreateSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    payment = serializer.save(submitted_by=request.user)
    return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class AdminPaymentListView(generics.ListAPIView):
    """GET /api/admin/payments/ — list all payments."""
    permission_classes = [IsAdminUser]
    serializer_class   = PaymentSerializer

    def get_queryset(self):
        return (
            Payment.objects
            .select_related('invoice', 'invoice__quotation', 'submitted_by', 'confirmed_by')
            .order_by('-created_at')
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_confirm_payment(request, payment_id):
    """Admin: confirm or reject a pending payment submission."""
    try:
        payment = Payment.objects.get(pk=payment_id)
    except Payment.DoesNotExist:
        return Response({'detail': 'Payment not found.'}, status=404)

    action = request.data.get('action', 'confirm')
    if action == 'confirm':
        payment.status       = PaymentStatus.CONFIRMED
        payment.confirmed_by = request.user
        payment.confirmed_at = timezone.now()
        payment.save(update_fields=['status', 'confirmed_by', 'confirmed_at', 'updated_at'])

        # Calculate sum of all confirmed payments for this invoice
        invoice = payment.invoice
        confirmed_payments = invoice.payments.filter(status=PaymentStatus.CONFIRMED)
        total_paid = sum(p.amount for p in confirmed_payments)
        quotation = invoice.quotation
        rfq = quotation.rfq

        if float(total_paid) >= float(quotation.grand_total):
            invoice.status     = InvoiceStatus.PAYMENT_CONFIRMED
            invoice.paid_at    = timezone.now()
            invoice.utr_number = payment.utr_reference
            invoice.save(update_fields=['status', 'paid_at', 'utr_number', 'updated_at'])

            quotation.status = QuotationStatus.PAYMENT_CONFIRMED
            quotation.save(update_fields=['status', 'updated_at'])

            rfq.status = RFQStatus.ORDER_PLACED
            rfq.save(update_fields=['status', 'updated_at'])
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
            invoice.save(update_fields=['status', 'updated_at'])

            quotation.status = QuotationStatus.PARTIALLY_PAID
            quotation.save(update_fields=['status', 'updated_at'])

    elif action == 'reject':
        payment.status = PaymentStatus.REJECTED
        payment.save(update_fields=['status', 'updated_at'])
    else:
        return Response({'action': 'Must be "confirm" or "reject".'}, status=400)

    return Response(PaymentSerializer(payment).data)


# ═════════════════════════════════════════════════════════════════════════════
# SHIPMENTS
# ═════════════════════════════════════════════════════════════════════════════

class AdminShipmentListView(generics.ListAPIView):
    """GET /api/admin/shipments/ — list all shipments."""
    permission_classes = [IsAdminUser]
    serializer_class   = ShipmentSerializer

    def get_queryset(self):
        return (
            Shipment.objects
            .select_related('purchase_order', 'purchase_order__quotation', 'created_by')
            .order_by('-created_at')
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_or_update_shipment(request, pk):
    """Admin: create or update the shipment record for a PurchaseOrder (pk = PO id)."""
    try:
        po = PurchaseOrder.objects.get(pk=pk)
    except PurchaseOrder.DoesNotExist:
        return Response({'detail': 'Purchase Order not found.'}, status=404)

    shipment = getattr(po, 'shipment', None)

    if shipment:
        # Update existing
        serializer = ShipmentCreateSerializer(shipment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save()
        return Response(ShipmentSerializer(shipment).data)
    else:
        # Create new
        data = request.data.copy()
        data['purchase_order'] = pk
        serializer = ShipmentCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save(created_by=request.user)
        return Response(ShipmentSerializer(shipment).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsCustomer])
def customer_shipment_status(request, pk):
    """Customer: get shipment status for a quotation (pk = quotation id)."""
    try:
        quotation = Quotation.objects.get(pk=pk, rfq__customer=request.user)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    po = getattr(quotation, 'purchase_order', None)
    if not po:
        return Response({'detail': 'No Purchase Order for this quotation yet.'}, status=404)

    shipment = getattr(po, 'shipment', None)
    if not shipment:
        return Response({'detail': 'Shipment has not been created yet.'}, status=404)

    return Response(ShipmentSerializer(shipment).data)


# ═════════════════════════════════════════════════════════════════════════════
# VENDOR VIEWS  — vendor sees only their own assigned QuotationItems
# ═════════════════════════════════════════════════════════════════════════════

class VendorPurchaseOrderListView(generics.ListAPIView):
    """
    GET /api/quotations/vendor/purchase-orders/
    Returns all PurchaseOrders where the logged-in vendor is involved.
    """
    permission_classes = [IsVendor]
    serializer_class = PurchaseOrderSerializer

    def get_queryset(self):
        vp = self.request.user.vendor_profile
        return (
            PurchaseOrder.objects
            .filter(quotation__items__vendor=vp)
            .distinct()
            .select_related('quotation', 'quotation__rfq', 'quotation__rfq__customer')
            .prefetch_related('log')
            .order_by('-created_at')
        )

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status as http_status

class VendorPurchaseOrderStatusUpdateView(APIView):
    """
    PATCH /api/quotations/vendor/purchase-orders/<pk>/status/
    """
    permission_classes = [IsVendor]

    def patch(self, request, pk):
        vp = request.user.vendor_profile
        try:
            po = PurchaseOrder.objects.get(pk=pk, quotation__items__vendor=vp)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'PO not found'}, status=http_status.HTTP_404_NOT_FOUND)
        
        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected', 'processing']:
            return Response({'error': 'Invalid status'}, status=http_status.HTTP_400_BAD_REQUEST)

        # Basic state machine validation
        if new_status in ['accepted', 'rejected'] and po.status not in ['pending', 'issued', 'acknowledged']:
            return Response({'error': 'Cannot accept/reject PO in current state'}, status=http_status.HTTP_400_BAD_REQUEST)
        if new_status == 'processing' and po.status != 'accepted':
            return Response({'error': 'PO must be accepted before processing'}, status=http_status.HTTP_400_BAD_REQUEST)

        po.status = new_status
        po.save()

        # Update log
        POIssueEntry.objects.create(
            purchase_order=po,
            action=new_status,
            actor=request.user,
            notes=f"Vendor updated status to {new_status}"
        )

        return Response(PurchaseOrderSerializer(po).data)


class VendorProformaInvoiceCreateView(APIView):
    """
    POST /api/quotations/vendor/purchase-orders/<pk>/proforma/
    Generate a Proforma Invoice for an accepted or processing PO.
    """
    permission_classes = [IsVendor]

    def post(self, request, pk):
        vp = request.user.vendor_profile
        try:
            po = PurchaseOrder.objects.get(pk=pk, quotation__items__vendor=vp)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'PO not found'}, status=http_status.HTTP_404_NOT_FOUND)

        if po.status not in ['accepted', 'processing']:
            return Response({'error': 'PO must be accepted or processing to generate a PI.'}, status=http_status.HTTP_400_BAD_REQUEST)

        quotation = po.quotation
        if hasattr(quotation, 'invoice'):
            # If an invoice already exists (PI or Tax), just return it.
            return Response(InvoiceSerializer(quotation.invoice).data, status=http_status.HTTP_200_OK)

        invoice = Invoice.objects.create(
            quotation=quotation,
            purchase_order=po,
            status=InvoiceStatus.DRAFT,
            is_proforma=True,
            created_by=request.user,
        )
        InvoiceLogEntry.objects.create(
            invoice=invoice,
            action='created',
            actor=request.user,
            notes='Proforma Invoice generated by vendor.',
        )
        return Response(InvoiceSerializer(invoice).data, status=http_status.HTTP_201_CREATED)

class VendorShipmentUpdateView(APIView):
    """
    POST /api/quotations/vendor/purchase-orders/<pk>/shipment/
    Create or update shipment for a PO. Generates Final Tax Invoice on DELIVERED.
    """
    permission_classes = [IsVendor]

    def post(self, request, pk):
        vp = request.user.vendor_profile
        try:
            po = PurchaseOrder.objects.get(pk=pk, quotation__items__vendor=vp)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'PO not found'}, status=http_status.HTTP_404_NOT_FOUND)

        shipment = getattr(po, 'shipment', None)
        if shipment:
            serializer = ShipmentCreateSerializer(shipment, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            shipment = serializer.save()
        else:
            data = request.data.copy()
            data['purchase_order'] = pk
            serializer = ShipmentCreateSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            shipment = serializer.save(created_by=request.user)

        # Generate Final Tax Invoice when delivered
        if shipment.status == ShipmentStatus.DELIVERED:
            invoice = getattr(po, 'invoice', None)
            if invoice and invoice.is_proforma:
                invoice.is_proforma = False
                invoice.invoice_number = invoice.invoice_number.replace('PI-', 'INV-')
                invoice.save(update_fields=['is_proforma', 'invoice_number', 'updated_at'])

        return Response(ShipmentSerializer(shipment).data)

class VendorRequestListView(generics.ListAPIView):
    """
    GET /api/quotations/vendor/requests/
    Returns all QuotationItems where vendor == logged-in vendor's VendorProfile.
    Each item carries full quotation + RFQ context via VendorQuotationItemSerializer.
    """
    permission_classes = [IsVendor]
    serializer_class   = VendorQuotationItemSerializer

    def get_queryset(self):
        vp = self.request.user.vendor_profile
        qs = (
            QuotationItem.objects
            .filter(vendor=vp)
            .select_related(
                'quotation', 'quotation__rfq', 'quotation__rfq__customer',
                'product', 'vendor',
            )
            .order_by('-created_at')
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(quotation__status=status_filter)
        return qs


class VendorRequestDetailView(generics.RetrieveAPIView):
    """
    GET /api/quotations/vendor/requests/<pk>/
    Single QuotationItem that belongs to this vendor.
    """
    permission_classes = [IsVendor]
    serializer_class   = VendorQuotationItemSerializer

    def get_queryset(self):
        vp = self.request.user.vendor_profile
        return (
            QuotationItem.objects
            .filter(vendor=vp)
            .select_related(
                'quotation', 'quotation__rfq', 'quotation__rfq__customer',
                'product', 'vendor',
            )
        )


@api_view(['PATCH'])
@permission_classes([IsVendor])
def vendor_submit_quote(request, item_pk):
    """
    PATCH /api/quotations/vendor/requests/<item_pk>/quote/
    Vendor fills in availability_qty, available_from, unit_price, notes, vendor_quote_ref.
    Only fields explicitly sent are updated (partial update).
    """
    vp = request.user.vendor_profile
    try:
        item = QuotationItem.objects.get(pk=item_pk, vendor=vp)
    except QuotationItem.DoesNotExist:
        return Response({'detail': 'Not found or not assigned to your account.'}, status=404)

    VENDOR_WRITABLE = {
        'availability_qty', 'available_from',
        'unit_price', 'vendor_quote_ref', 'notes',
        'discount_pct', 'tax_pct',
    }
    data = {k: v for k, v in request.data.items() if k in VENDOR_WRITABLE}
    if not data:
        return Response(
            {'detail': 'No writable fields provided.'},
            status=400,
        )

    serializer = QuotationItemCreateSerializer(item, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    item = serializer.save()
    return Response(VendorQuotationItemSerializer(item).data)


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Quotation Builder — full quotation for a Quotation/RFQ
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsVendor])
def vendor_quotation_detail(request, quotation_pk):
    """
    GET /api/quotations/vendor/quotations/<quotation_pk>/
    Full quotation header + all items that belong to this vendor.
    Vendor must have at least one QuotationItem assigned in this quotation.
    """
    vp = request.user.vendor_profile
    # Check vendor is assigned to at least one item in this quotation
    has_item = QuotationItem.objects.filter(quotation_id=quotation_pk, vendor=vp).exists()
    if not has_item:
        return Response({'detail': 'Not found or you have no items in this quotation.'}, status=404)

    try:
        quotation = (
            Quotation.objects
            .select_related('rfq', 'rfq__customer')
            .prefetch_related('items')
            .get(pk=quotation_pk)
        )
    except Quotation.DoesNotExist:
        return Response({'detail': 'Quotation not found.'}, status=404)

    items = QuotationItem.objects.filter(
        quotation=quotation, vendor=vp
    ).select_related('product', 'vendor')

    return Response({
        'quotation': QuotationSerializer(quotation).data,
        'vendor_items': VendorQuotationItemSerializer(items, many=True).data,
    })


@api_view(['PATCH'])
@permission_classes([IsVendor])
def vendor_update_quotation_terms(request, quotation_pk):
    """
    PATCH /api/quotations/vendor/quotations/<quotation_pk>/terms/
    Vendor updates the shared quotation terms:
      expected_delivery, valid_until, shipping_charge, terms_notes
    Only allowed while quotation is in draft / sent / viewed.
    """
    vp = request.user.vendor_profile
    has_item = QuotationItem.objects.filter(quotation_id=quotation_pk, vendor=vp).exists()
    if not has_item:
        return Response({'detail': 'Not found or no items assigned.'}, status=404)

    try:
        quotation = Quotation.objects.get(pk=quotation_pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Quotation not found.'}, status=404)

    ALLOWED_STATUSES = (QuotationStatus.DRAFT, QuotationStatus.SENT, QuotationStatus.VIEWED)
    if quotation.status not in ALLOWED_STATUSES:
        return Response(
            {'detail': f'Cannot edit terms for a quotation with status "{quotation.status}".'},
            status=400,
        )

    VENDOR_TERM_FIELDS = {'expected_delivery', 'valid_until', 'shipping_charge', 'terms_notes'}
    update_fields = []
    for field in VENDOR_TERM_FIELDS:
        if field in request.data:
            setattr(quotation, field, request.data[field] if request.data[field] != '' else None)
            update_fields.append(field)

    if update_fields:
        update_fields.append('updated_at')
        quotation.save(update_fields=update_fields)

    return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsVendor])
def vendor_bulk_update_items(request, quotation_pk):
    """
    POST /api/quotations/vendor/quotations/<quotation_pk>/items/bulk/
    Vendor submits all their items for a quotation in one call.
    Body: { items: [{ id, unit_price, discount_pct, tax_pct, availability_qty, available_from, vendor_quote_ref, notes }] }
    """
    vp = request.user.vendor_profile
    items_data = request.data.get('items', [])
    if not items_data:
        return Response({'detail': 'No items provided.'}, status=400)

    updated = []
    errors = []
    for item_data in items_data:
        item_id = item_data.get('id')
        if not item_id:
            errors.append({'error': 'Each item must have an id.'})
            continue
        try:
            item = QuotationItem.objects.get(pk=item_id, quotation_id=quotation_pk, vendor=vp)
        except QuotationItem.DoesNotExist:
            errors.append({'id': item_id, 'error': 'Not found or not your item.'})
            continue

        VENDOR_WRITABLE = {
            'unit_price', 'discount_pct', 'tax_pct',
            'availability_qty', 'available_from',
            'vendor_quote_ref', 'notes',
        }
        data = {k: v for k, v in item_data.items() if k in VENDOR_WRITABLE}
        serializer = QuotationItemCreateSerializer(item, data=data, partial=True)
        if serializer.is_valid():
            updated.append(serializer.save())
        else:
            errors.append({'id': item_id, 'errors': serializer.errors})

    return Response({
        'updated': VendorQuotationItemSerializer(updated, many=True).data,
        'errors':  errors,
    })


@api_view(['POST'])
@permission_classes([IsVendor])
def vendor_submit_quotation(request, quotation_pk):
    """
    POST /api/quotations/vendor/quotations/<quotation_pk>/submit/
    Marks the vendor's items as submitted (sets vendor_quote_ref to 'SUBMITTED' if empty,
    appends a submission note to each item's notes).
    If ALL items in the quotation are now priced (unit_price > 0), advances quotation
    status from draft → sent so the customer can see it.
    """
    vp = request.user.vendor_profile
    vendor_items = QuotationItem.objects.filter(quotation_id=quotation_pk, vendor=vp)
    if not vendor_items.exists():
        return Response({'detail': 'No items assigned to you in this quotation.'}, status=404)

    # Validate at least unit_price is set on all vendor items
    unpriced = vendor_items.filter(unit_price=0)
    if unpriced.exists():
        return Response(
            {'detail': f'{unpriced.count()} item(s) still have unit_price = 0. Please fill in all prices before submitting.'},
            status=400,
        )

    try:
        quotation = Quotation.objects.get(pk=quotation_pk)
    except Quotation.DoesNotExist:
        return Response({'detail': 'Quotation not found.'}, status=404)

    # All items in the quotation — if all priced, advance quotation
    all_items = QuotationItem.objects.filter(quotation=quotation)
    all_priced = not all_items.filter(unit_price=0).exists()

    if all_priced and quotation.status == QuotationStatus.DRAFT:
        quotation.status = QuotationStatus.SENT
        quotation.sent_at = timezone.now()
        quotation.save(update_fields=['status', 'sent_at', 'updated_at'])
        # Update RFQ status too
        rfq = quotation.rfq
        if rfq.status == RFQStatus.UNDER_REVIEW:
            rfq.status = RFQStatus.QUOTED
            rfq.save(update_fields=['status', 'updated_at'])

    return Response({
        'quotation': QuotationSerializer(quotation).data,
        'vendor_items': VendorQuotationItemSerializer(vendor_items, many=True).data,
        'message': 'Quotation submitted successfully.' if all_priced else 'Items saved. Waiting for other vendors to price their items before sending to customer.',
    })



# ═════════════════════════════════════════════════════════════════════════════
# INVOICE PDF — standalone HTML page (print-ready, A4)
# ═════════════════════════════════════════════════════════════════════════════

from django.http import HttpResponse
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model


@api_view(['GET'])
@permission_classes([permissions.AllowAny])   # Auth handled manually via query-param token
def invoice_pdf_view(request, pk):
    """
    GET /api/quotations/<pk>/invoice/pdf/?token=<jwt>

    Returns a complete, standalone, print-optimised A4 HTML page for the invoice.
    The frontend opens this in a new tab; the page auto-calls window.print() so
    the user can save to PDF via the browser's native print dialog.

    Auth: JWT passed as ?token= query-param (needed because new-tab GET requests
    cannot carry Authorization headers).
    """
    # ── Authenticate via query-param token ───────────────────────────────────
    token_str = request.query_params.get('token', '').strip()
    if not token_str:
        return HttpResponse('<h2 style="font-family:sans-serif;padding:2rem">Unauthorized: token required.</h2>', status=401)
    try:
        User = get_user_model()
        tok  = AccessToken(token_str)
        user = User.objects.get(pk=tok['user_id'])
    except Exception:
        return HttpResponse('<h2 style="font-family:sans-serif;padding:2rem">Unauthorized: invalid or expired token.</h2>', status=401)

    # ── Load quotation + invoice ──────────────────────────────────────────────
    try:
        quotation = (
            Quotation.objects
            .select_related(
                'rfq', 'rfq__customer',
                'invoice', 'invoice__purchase_order',
            )
            .prefetch_related('items', 'items__product')
            .get(pk=pk)
        )
    except Quotation.DoesNotExist:
        return HttpResponse('<h2 style="font-family:sans-serif;padding:2rem">Quotation not found.</h2>', status=404)

    # Only the customer or an admin may view
    if not user.is_admin_user and quotation.rfq.customer != user:
        return HttpResponse('<h2 style="font-family:sans-serif;padding:2rem">Forbidden.</h2>', status=403)

    try:
        invoice = quotation.invoice
    except Exception:
        return HttpResponse('<h2 style="font-family:sans-serif;padding:2rem">Invoice not yet generated for this quotation.</h2>', status=404)

    # ── Build data for the template ───────────────────────────────────────────
    from decimal import Decimal

    customer = quotation.rfq.customer
    # BuyerProfile is optional — import lazily to avoid circular dependency
    try:
        from accounts.models import BuyerProfile
        buyer = BuyerProfile.objects.get(user=customer)
    except Exception:
        buyer = None

    items = list(quotation.items.all())

    # If no line-items exist, synthesise one row from the Quotation header
    if not items:
        class _FakeItem:
            pass
        fi = _FakeItem()
        fi.product_name   = quotation.product_name
        fi.hsn_code       = getattr(invoice, 'hsn_code', '8542') or '8542'
        fi.quantity       = quotation.quantity
        fi.unit_price     = Decimal(str(quotation.unit_price))
        fi.discount_pct   = Decimal(str(quotation.discount_pct))
        fi.tax_pct        = Decimal(str(quotation.tax_pct))
        sub               = float(fi.quantity) * float(fi.unit_price)
        disc              = sub * float(fi.discount_pct) / 100
        fi.line_total     = round(sub - disc, 2)
        fi.line_total_with_tax = round(fi.line_total + fi.line_total * float(fi.tax_pct) / 100, 2)
        items = [fi]

    grand_total = float(quotation.grand_total)
    sub_total   = sum(float(i.line_total) for i in items)
    shipping    = float(quotation.shipping_charge)
    total_gst   = round(grand_total - sub_total - shipping, 2)

    po = getattr(quotation, 'purchase_order', None)

    def fmt_date(dt):
        if not dt:
            return '—'
        if hasattr(dt, 'strftime'):
            return dt.strftime('%d %b %Y')
        return str(dt)[:10] if dt else '—'

    def fmt_inr(val):
        try:
            v = float(val)
        except Exception:
            return 'INR 0.00'
        # Use INR prefix — xhtml2pdf default fonts lack the rupee glyph
        return f'INR {v:,.2f}'

    # ── Seller constants (can be moved to a CompanyProfile model later) ───────
    seller_gstin   = '33AABCE1234F1ZM'
    seller_name    = 'ElectroHub Technologies Pvt. Ltd.'
    seller_address = 'Plot 45, SIDCO Industrial Estate, Chennai – 600 098, Tamil Nadu, India'
    seller_phone   = '+91 44 4000 1234'
    seller_email   = 'billing@electrohub.in'
    seller_pan     = 'AABCE1234F'

    # ── Buyer details ─────────────────────────────────────────────────────────
    buyer_name    = (buyer.company_name if buyer and buyer.company_name
                     else (customer.get_full_name() or customer.email))
    buyer_address = (
        f'{buyer.billing_line1}, {buyer.billing_city} – {buyer.billing_pincode}, {buyer.billing_state}'
        if buyer and buyer.billing_line1
        else quotation.delivery_location
    )
    buyer_gstin   = invoice.gstin_buyer or (buyer.gstin if buyer else '') or '—'
    buyer_email   = customer.email
    buyer_phone   = customer.phone or '—'

    # ── Build product rows — one continuous table, NO forced page-break per row
    rows_html = ''
    for idx, item in enumerate(items, start=1):
        tax_pct = float(item.tax_pct)
        disc    = float(item.discount_pct)
        lt      = float(item.line_total)
        lt_tax  = float(item.line_total_with_tax)
        gst_amt = round(lt_tax - lt, 2)
        rows_html += (
            f'<tr>'
            f'<td class="c">{idx}</td>'
            f'<td>{item.product_name}<br><span class="small muted">HSN: {item.hsn_code or "8542"}</span></td>'
            f'<td class="c">{item.quantity:,}</td>'
            f'<td class="r">{fmt_inr(item.unit_price)}</td>'
            f'<td class="r">{disc:.1f}%</td>'
            f'<td class="r">{fmt_inr(lt)}</td>'
            f'<td class="c">{tax_pct:.0f}%</td>'
            f'<td class="r">{fmt_inr(gst_amt)}</td>'
            f'<td class="r bold">{fmt_inr(lt_tax)}</td>'
            f'</tr>'
        )

    paid_label = 'Payment Confirmed' if invoice.status == 'payment_confirmed' else 'Payment Due'
    watermark  = ''  # watermark not supported in xhtml2pdf
    utr_row    = (f'<tr><td class="bl">UTR / Ref</td>'
                  f'<td><b>{invoice.utr_number}</b></td></tr>' if invoice.utr_number else '')
    paid_on_row = (f'<tr><td class="bl">Paid On</td>'
                   f'<td>{fmt_date(invoice.paid_at)}</td></tr>' if invoice.paid_at else '')
    terms_p     = f'{quotation.terms_notes}<br/>' if quotation.terms_notes else ''
    payment_terms = (buyer.payment_terms if buyer and buyer.payment_terms else 'Net 15 days')

    # ── Build PDF using xhtml2pdf ─────────────────────────────────────────────
    from io import BytesIO
    from xhtml2pdf import pisa

    paid_badge_bg    = '#dcfce7' if invoice.status == 'payment_confirmed' else '#dbeafe'
    paid_badge_color = '#166534' if invoice.status == 'payment_confirmed' else '#1d4ed8'

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Invoice {invoice.invoice_number} &#8212; ElectroHub</title>
<style>
  html, body {{ font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a2e; background: #fff; margin: 0; padding: 0; }}
  .bold {{ font-weight: bold; }}
  .small {{ font-size: 8pt; }}
  .muted {{ color: #6b7280; }}
  .r {{ text-align: right; }}
  .c {{ text-align: center; }}
  /* Header row using table */
  .header-table {{ width: 100%; border-bottom: 2.5pt solid #2563eb; padding-bottom: 6pt; margin-bottom: 8pt; }}
  .logo {{ font-size: 20pt; font-weight: bold; color: #2563eb; }}
  .tagline {{ font-size: 8pt; color: #6b7280; }}
  .invoice-meta {{ text-align: right; }}
  .inv-label {{ font-size: 8pt; color: #6b7280; text-transform: uppercase; }}
  .inv-number {{ font-size: 14pt; font-weight: bold; color: #1a1a2e; }}
  .status-badge {{ display: inline; padding: 2pt 6pt; font-size: 8pt; font-weight: bold;
    background: {paid_badge_bg}; color: {paid_badge_color}; }}
  /* Parties table */
  .parties-table {{ width: 100%; border-collapse: collapse; margin-bottom: 8pt; }}
  .parties-table td {{ width: 33%; border: 0.75pt solid #e5e7eb; padding: 6pt 7pt; vertical-align: top; font-size: 9pt; line-height: 1.5; }}
  .box-title {{ font-size: 7pt; font-weight: bold; text-transform: uppercase; color: #2563eb;
    border-bottom: 0.5pt solid #e5e7eb; padding-bottom: 3pt; margin-bottom: 4pt; }}
  .company {{ font-weight: bold; font-size: 9.5pt; margin-bottom: 2pt; }}
  /* Ref strip table */
  .ref-table {{ width: 100%; border-collapse: collapse; margin-bottom: 8pt; }}
  .ref-table td {{ border: 0.75pt solid #e5e7eb; padding: 4pt 6pt; }}
  .ri-label {{ font-size: 7pt; color: #6b7280; text-transform: uppercase; }}
  .ri-value {{ font-size: 9pt; font-weight: bold; margin-top: 1pt; }}
  .section-title {{ font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #2563eb;
    border-left: 3pt solid #2563eb; padding-left: 6pt; margin-bottom: 5pt; }}
  /* Products table */
  table.items {{ width: 100%; border-collapse: collapse; }}
  table.items thead tr {{ background: #1e3a5f; color: #fff; }}
  table.items thead th {{ padding: 5pt; font-size: 8pt; font-weight: bold; text-transform: uppercase; }}
  table.items tbody tr {{ border-bottom: 0.5pt solid #e5e7eb; }}
  table.items tbody tr.even {{ background: #f8fafc; }}
  table.items tbody td {{ padding: 5pt; font-size: 9pt; vertical-align: top; }}
  /* Totals */
  .totals-table {{ width: 240pt; border: 0.75pt solid #e5e7eb; border-collapse: collapse; margin-top: 6pt; margin-bottom: 8pt; }}
  .totals-table td {{ padding: 4pt 8pt; font-size: 9pt; border-bottom: 0.5pt solid #e5e7eb; }}
  .grand-row {{ background: #1e3a5f; color: #fff; }}
  .grand-row td {{ font-size: 10pt; font-weight: bold; padding: 5pt 8pt; }}
  /* Bank grid using table */
  .bank-table {{ width: 100%; border-collapse: collapse; margin-bottom: 8pt; }}
  .bank-table td {{ width: 50%; border: 0.75pt solid #e5e7eb; padding: 6pt 8pt; vertical-align: top; }}
  .inner-table {{ width: 100%; border: 0; padding: 0; }}
  .inner-table td {{ padding: 1pt 0; font-size: 9pt; vertical-align: top; border: 0; }}
  .bl {{ color: #6b7280; width: 80pt; }}
  /* Footer */
  .footer-table {{ width: 100%; border-top: 0.75pt solid #e5e7eb; margin-top: 8pt; padding-top: 6pt; }}
  .footer-table td {{ vertical-align: top; font-size: 8pt; color: #6b7280; line-height: 1.5; }}
  .sig-line {{ border-top: 0.75pt solid #1a1a2e; width: 110pt; margin-top: 22pt; margin-bottom: 2pt; }}
  table {{ -pdf-keep-with-next: false; page-break-inside: auto; }}
  tr {{ page-break-inside: avoid; }}
  @page {{ size: A4; margin: 10mm 10mm; }}
</style>
</head>
<body>
{watermark}

<table class="header-table">
  <tr>
    <td style="vertical-align:top">
      <div class="logo">ElectroHub</div>
      <div class="tagline">Electronics &amp; Components &#8212; B2B Division</div>
    </td>
    <td class="invoice-meta" style="vertical-align:top; text-align:right">
      <div class="inv-label">{'Proforma Invoice' if getattr(invoice, 'is_proforma', False) else 'Tax Invoice'}</div>
      <div class="inv-number">{invoice.invoice_number}</div>
      <div class="status-badge">{paid_label}</div>
    </td>
  </tr>
</table>

<table class="parties-table">
  <tr>
    <td>
      <div class="box-title">Seller</div>
      <div class="company">{seller_name}</div>
      <div>{seller_address}</div>
      <div>GSTIN: <b>{seller_gstin}</b></div>
      <div>PAN: {seller_pan}</div>
      <div>{seller_phone} | {seller_email}</div>
    </td>
    <td>
      <div class="box-title">Bill To / Buyer</div>
      <div class="company">{buyer_name}</div>
      <div>{buyer_address}</div>
      <div>GSTIN: <b>{buyer_gstin}</b></div>
      <div>{buyer_email}</div>
      <div>{buyer_phone}</div>
    </td>
    <td>
      <div class="box-title">Ship To</div>
      <div class="company">{buyer_name}</div>
      <div>{quotation.delivery_location}</div>
      <div class="muted small">Delivery by: <b>{fmt_date(quotation.expected_delivery)}</b></div>
    </td>
  </tr>
</table>

<table class="ref-table">
  <tr>
    <td><div class="ri-label">Invoice No.</div><div class="ri-value">{invoice.invoice_number}</div></td>
    <td><div class="ri-label">Invoice Date</div><div class="ri-value">{fmt_date(invoice.created_at)}</div></td>
    <td><div class="ri-label">Due Date</div><div class="ri-value">{fmt_date(invoice.due_date)}</div></td>
    <td><div class="ri-label">Quotation No.</div><div class="ri-value">{quotation.quotation_number}</div></td>
    <td><div class="ri-label">PO Number</div><div class="ri-value">{po.po_number if po else '&mdash;'}</div></td>
    <td><div class="ri-label">RFQ No.</div><div class="ri-value">{quotation.rfq.rfq_number}</div></td>
  </tr>
</table>

<div class="section-title">Products / Line Items</div>
<table class="items">
  <thead>
    <tr>
      <th class="c" style="width:22pt">#</th>
      <th style="text-align:left">Description &amp; HSN</th>
      <th class="c" style="width:34pt">Qty</th>
      <th class="r" style="width:60pt">Unit Price</th>
      <th class="r" style="width:36pt">Disc.</th>
      <th class="r" style="width:62pt">Taxable Amt</th>
      <th class="c" style="width:36pt">GST%</th>
      <th class="r" style="width:56pt">GST Amt</th>
      <th class="r" style="width:66pt">Total</th>
    </tr>
  </thead>
  <tbody>
    {rows_html}
  </tbody>
</table>

<table style="width: 100%; border: 0; padding: 0;">
  <tr>
    <td style="width: 50%; border: 0;"></td>
    <td style="width: 50%; border: 0; text-align: right;" align="right">
      <table class="totals-table" align="right">
        <tr><td style="text-align: left;">Sub-total (before GST)</td><td class="r">{fmt_inr(sub_total)}</td></tr>
        <tr><td style="text-align: left;">Total GST</td><td class="r">{fmt_inr(total_gst)}</td></tr>
        <tr><td style="text-align: left;">Shipping &amp; Handling</td><td class="r">{'Free' if shipping == 0 else fmt_inr(shipping)}</td></tr>
        <tr class="grand-row"><td style="text-align: left;">GRAND TOTAL</td><td class="r">{fmt_inr(grand_total)}</td></tr>
      </table>
    </td>
  </tr>
</table>

<table class="bank-table">
  <tr>
    <td>
      <div class="box-title">Bank Payment Details</div>
      <table class="inner-table">
        <tr><td class="bl">Bank Name</td><td><b>HDFC Bank Ltd.</b></td></tr>
        <tr><td class="bl">Account No.</td><td><b>50200012345678</b></td></tr>
        <tr><td class="bl">IFSC Code</td><td><b>HDFC0001234</b></td></tr>
        <tr><td class="bl">Account Name</td><td>ElectroHub Technologies Pvt. Ltd.</td></tr>
        <tr><td class="bl">Branch</td><td>Chennai &#8212; Anna Salai</td></tr>
      </table>
      <div class="small muted" style="margin-top:4pt">Please quote invoice number in payment reference.</div>
    </td>
    <td>
      <div class="box-title">Payment &amp; Terms</div>
      <table class="inner-table">
        <tr><td class="bl">Payment Terms</td><td>{payment_terms}</td></tr>
        <tr><td class="bl">Due Date</td><td><b>{fmt_date(invoice.due_date)}</b></td></tr>
        <tr><td class="bl">Invoice Status</td><td><b>{'Payment Confirmed' if invoice.status == 'payment_confirmed' else 'Awaiting Payment'}</b></td></tr>
        {utr_row}
        {paid_on_row}
      </table>
    </td>
  </tr>
</table>

<table class="footer-table">
  <tr>
    <td style="width:70%">
      <b>Terms &amp; Conditions</b><br/>
      {terms_p}
      Goods once sold will not be taken back or exchanged without prior written approval.<br/>
      Disputes subject to Chennai jurisdiction only.<br/>
      <span class="muted">This is a computer-generated invoice and does not require a physical signature.</span>
    </td>
    <td style="text-align:right; width:30%">
      <div class="sig-line"></div>
      <b>{seller_name}</b><br/>
      <span class="muted">Authorised Signatory</span>
    </td>
  </tr>
</table>

</body>
</html>'''

    html_with_print = html.replace('</body>', '<script>window.onload = function() { window.print(); }</script></body>')
    return HttpResponse(html_with_print, content_type='text/html')

