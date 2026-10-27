"""ElectroHub — Admin views for vendor management."""

from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import VendorProfile
from .serializers import VendorProfileSerializer
from .permissions import IsAdminUser


class AdminVendorListView(generics.ListAPIView):
    """GET /api/admin/vendors/ — list all vendor profiles."""
    serializer_class   = VendorProfileSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return VendorProfile.objects.select_related('user').all()


def _change_vendor_status(request, vendor_id, new_status):
    """Shared helper to change a vendor's status."""
    try:
        vendor = VendorProfile.objects.get(pk=vendor_id)
    except VendorProfile.DoesNotExist:
        return Response({'detail': 'Vendor not found.'}, status=404)

    vendor.status = new_status
    vendor.rejection_reason = (
        request.data.get('reason', '')
        if new_status == VendorProfile.Status.REJECTED
        else ''
    )
    vendor.save()
    return Response(VendorProfileSerializer(vendor).data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def approve_vendor(request, vendor_id):
    return _change_vendor_status(request, vendor_id, VendorProfile.Status.APPROVED)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def reject_vendor(request, vendor_id):
    return _change_vendor_status(request, vendor_id, VendorProfile.Status.REJECTED)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def suspend_vendor(request, vendor_id):
    return _change_vendor_status(request, vendor_id, VendorProfile.Status.SUSPENDED)
