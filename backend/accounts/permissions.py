"""
ElectroHub — Centralised DRF Permission Classes

Import from here instead of defining inline.  All role checks use the
`CustomUser.role` string (stored upper-case, e.g. 'HOD').
"""

from rest_framework import permissions


# ─────────────────────────────────────────────────────────────────────────────
# B2C roles
# ─────────────────────────────────────────────────────────────────────────────

class IsCustomer(permissions.BasePermission):
    """Authenticated user with CUSTOMER role."""
    message = 'Only customers may access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.upper() == 'CUSTOMER'
        )


class IsVendor(permissions.BasePermission):
    """Authenticated user with VENDOR role."""
    message = 'Only vendors may access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.upper() == 'VENDOR'
        )


# ─────────────────────────────────────────────────────────────────────────────
# B2B workflow staff roles
# ─────────────────────────────────────────────────────────────────────────────

class IsHOD(permissions.BasePermission):
    """Head of Department — first-level quotation approver."""
    message = 'Only HOD users may perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.upper() == 'HOD'
        )


class IsDirector(permissions.BasePermission):
    """Director — second-level quotation approver."""
    message = 'Only Director users may perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.upper() == 'DIRECTOR'
        )


class IsAccountant(permissions.BasePermission):
    """Accountant — invoice & payment confirmation."""
    message = 'Only Accountant users may perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.upper() == 'ACCOUNTANT'
        )


class IsStaffRole(permissions.BasePermission):
    """Any B2B workflow staff role: HOD, Director, or Accountant."""
    message = 'Only workflow staff (HOD / Director / Accountant) may access this resource.'

    _ROLES = {'HOD', 'DIRECTOR', 'ACCOUNTANT'}

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role.upper() in self._ROLES
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin / elevated
# ─────────────────────────────────────────────────────────────────────────────

class IsAdminUser(permissions.BasePermission):
    """ADMIN role or Django is_staff flag."""
    message = 'Only administrators may access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.is_admin_user
        )


class IsElevatedUser(permissions.BasePermission):
    """Admin, HOD, Director, or Accountant."""
    message = 'Elevated privileges required.'

    _ROLES = {'ADMIN', 'HOD', 'DIRECTOR', 'ACCOUNTANT'}

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and (request.user.is_admin_user or request.user.role.upper() in self._ROLES)
        )


# ─────────────────────────────────────────────────────────────────────────────
# Composite helpers
# ─────────────────────────────────────────────────────────────────────────────

class IsCustomerOrAdmin(permissions.BasePermission):
    """Customer OR admin — e.g. admin can view any customer's data."""
    message = 'Authentication required.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.role.upper()
        return role == 'CUSTOMER' or request.user.is_admin_user


class IsApprovalStaff(permissions.BasePermission):
    """
    HOD, Director, Accountant, or Admin.
    Used on approval-workflow endpoints where all four may read,
    but individual role checks enforce who can act on each step.
    """
    message = 'Approval workflow access requires elevated privileges.'

    _ROLES = {'HOD', 'DIRECTOR', 'ACCOUNTANT', 'ADMIN'}

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and (request.user.is_admin_user or request.user.role.upper() in self._ROLES)
        )
