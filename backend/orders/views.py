from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from .models import Order
from .serializers import (
    OrderSerializer,
    CreateOrderSerializer,
    VendorOrderSerializer,
)


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.lower() == 'admin'
        )

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.lower() == 'customer'
        )


# ── Customer: list own orders / create new order ──────────────────────────────
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            Order.objects
            .filter(customer=self.request.user)
            .prefetch_related('items__product', 'items__vendor')
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        return CreateOrderSerializer if self.request.method == 'POST' else OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ── Customer or Admin: retrieve one order ────────────────────────────────────
class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role.lower()
        qs   = Order.objects.prefetch_related('items__product', 'items__vendor')
        if role == 'admin':
            return qs.all()
        if role == 'vendor':
            return qs.filter(items__vendor__user=user).distinct()
        # customer
        return qs.filter(customer=user)

    def get_serializer_class(self):
        user = self.request.user
        if user.is_authenticated and user.role.lower() == 'vendor':
            return VendorOrderSerializer
        return OrderSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated and user.role.lower() == 'vendor':
            ctx['vendor_profile'] = getattr(user, 'vendor_profile', None)
        return ctx

@api_view(['POST'])
@permission_classes([IsCustomer])
def mark_order_completed(request, pk):
    order = Order.objects.filter(pk=pk, customer=request.user).first()
    if not order:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if order.status != 'delivered':
        return Response({'detail': 'Order must be delivered before it can be completed.'}, status=status.HTTP_400_BAD_REQUEST)
    
    order.status = 'completed'
    order.save(update_fields=['status', 'updated_at'])
    return Response(OrderSerializer(order).data)


# ── Admin: list all orders and update status ─────────────────────────────────
class AdminOrderListCreateView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.prefetch_related('items__product', 'items__vendor').order_by('-created_at')

class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OrderSerializer
    queryset = Order.objects.all()


def _require_approved_vendor(user):
    """Raise PermissionDenied if user is not an approved vendor."""
    if user.role.lower() != 'vendor':
        raise PermissionDenied('Vendor access only.')
    vp = getattr(user, 'vendor_profile', None)
    if vp is None or vp.status != 'approved':
        raise PermissionDenied('Approved vendors only.')
    return vp


# ── Vendor: list orders containing their products ────────────────────────────
class VendorOrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        vp = _require_approved_vendor(self.request.user)
        return (
            Order.objects
            .filter(items__vendor=vp)
            .distinct()
            .prefetch_related('items__product', 'items__vendor')
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        return VendorOrderSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['vendor_profile'] = getattr(self.request.user, 'vendor_profile', None)
        return ctx


# ── Vendor: update order status ───────────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def vendor_order_status(request, pk):
    vp    = _require_approved_vendor(request.user)
    order = (
        Order.objects
        .filter(pk=pk, items__vendor=vp)
        .distinct()
        .first()
    )
    if not order:
        return Response(
            {'detail': 'Order not found or does not contain your products.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    new_status   = request.data.get('status')
    valid_statuses = {value for value, _ in Order.STATUS_CHOICES}
    if new_status not in valid_statuses:
        return Response(
            {'status': f'Choose a valid status: {", ".join(sorted(valid_statuses))}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.status = new_status
    order.save(update_fields=['status', 'updated_at'])

    serializer = VendorOrderSerializer(
        order,
        context={'request': request, 'vendor_profile': vp},
    )
    return Response(serializer.data)
