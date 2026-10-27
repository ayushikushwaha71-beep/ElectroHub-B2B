from rest_framework.permissions import BasePermission

class IsApprovedVendor(BasePermission):
    message = 'Only approved vendors can manage products.'
    def has_permission(self, request, view):
        profile = getattr(request.user, 'vendor_profile', None)
        return bool(request.user.is_authenticated and request.user.role == 'vendor' and profile and profile.status == 'approved')
