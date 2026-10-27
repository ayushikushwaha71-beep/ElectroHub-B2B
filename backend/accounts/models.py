from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', self.model.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):

    username = None
    groups = None
    user_permissions = None

    class Role(models.TextChoices):
        CUSTOMER    = 'CUSTOMER',    'Customer'
        VENDOR      = 'VENDOR',      'Vendor'
        ADMIN       = 'ADMIN',       'Admin'
        HOD         = 'HOD',         'Head of Department'
        DIRECTOR    = 'DIRECTOR',    'Director'
        ACCOUNTANT  = 'ACCOUNTANT',  'Accountant'

    # Existing database column is "email"
    email = models.EmailField(unique=True)

    # Existing database already has "role"
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )

    # Existing database column is "phone_number"
    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        db_column='phone_number'
    )
    profile_image = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    updated_at = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    # Existing database uses email for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'accounts_user'

    # ── Role helpers ──────────────────────────────────────────────────────

    _STAFF_ROLES = {Role.HOD, Role.DIRECTOR, Role.ACCOUNTANT}
    _ALL_ELEVATED = {Role.ADMIN, Role.HOD, Role.DIRECTOR, Role.ACCOUNTANT}

    @property
    def is_admin_user(self):
        """True for ADMIN and Django staff — broad admin panel access."""
        return self.is_staff or self.role == self.Role.ADMIN

    @property
    def is_staff_role(self):
        """True for HOD, Director, Accountant — B2B workflow staff."""
        return self.role in self._STAFF_ROLES

    @property
    def is_elevated(self):
        """True for any elevated role (Admin + staff workflow roles)."""
        return self.is_admin_user or self.is_staff_role


class VendorProfile(models.Model):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )

    business_name = models.CharField(max_length=200)
    business_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    gstin = models.CharField(max_length=15, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendor_profiles'
        ordering = ['-created_at']

    @property
    def is_approved(self):
        return self.status == self.Status.APPROVED

    def __str__(self):
        return f'{self.business_name} ({self.get_status_display()})'


# ─────────────────────────────────────────────────────────────────────────────
# Address — saved delivery addresses for a customer
# ─────────────────────────────────────────────────────────────────────────────

class Address(models.Model):
    TYPE_CHOICES = [
        ('home',  'Home'),
        ('work',  'Work'),
        ('other', 'Other'),
    ]

    user        = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='addresses'
    )
    type        = models.CharField(max_length=10, choices=TYPE_CHOICES, default='home')
    label       = models.CharField(max_length=50, blank=True)

    first_name  = models.CharField(max_length=100)
    last_name   = models.CharField(max_length=100, blank=True)
    phone       = models.CharField(max_length=20)

    line1       = models.CharField(max_length=300)
    line2       = models.CharField(max_length=300, blank=True)
    city        = models.CharField(max_length=100)
    state       = models.CharField(max_length=100)
    pincode     = models.CharField(max_length=10)
    country     = models.CharField(max_length=100, default='India')

    is_default  = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_addresses'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name} — {self.city}'


# ─────────────────────────────────────────────────────────────────────────────
# WishlistItem — per-user product wishlist
# ─────────────────────────────────────────────────────────────────────────────

class WishlistItem(models.Model):
    user       = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
    )
    product    = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='wishlist_entries',
    )
    added_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table       = 'wishlist_items'
        unique_together = ('user', 'product')
        ordering        = ['-added_at']

    def __str__(self):
        return f'{self.user.email} → {self.product.name}'


# ─────────────────────────────────────────────────────────────────────────────
# BuyerProfile — B2B company details for a customer
#   Separate from CustomUser (auth entity) and VendorProfile (supplier side).
#   Created on demand when a customer upgrades to B2B / submits first RFQ.
# ─────────────────────────────────────────────────────────────────────────────

class BuyerProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='buyer_profile',
        limit_choices_to={'role': 'CUSTOMER'},
    )

    company_name     = models.CharField(max_length=200)
    gstin            = models.CharField(max_length=15, blank=True)
    pan              = models.CharField(max_length=10, blank=True)

    # Billing / registered address
    billing_line1    = models.CharField(max_length=300, blank=True)
    billing_line2    = models.CharField(max_length=300, blank=True)
    billing_city     = models.CharField(max_length=100, blank=True)
    billing_state    = models.CharField(max_length=100, blank=True)
    billing_pincode  = models.CharField(max_length=10, blank=True)
    billing_country  = models.CharField(max_length=100, default='India')

    # Finance
    credit_limit     = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        help_text='Maximum outstanding credit allowed (0 = no credit).',
    )
    payment_terms    = models.CharField(
        max_length=50, blank=True,
        help_text='e.g. "Net 30", "Advance", "LC"',
    )

    # Contact
    contact_person   = models.CharField(max_length=150, blank=True)
    contact_phone    = models.CharField(max_length=20, blank=True)
    contact_email    = models.EmailField(blank=True)

    is_verified      = models.BooleanField(default=False)
    notes            = models.TextField(blank=True)

    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'buyer_profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.company_name} ({self.user.email})'