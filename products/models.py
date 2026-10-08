from django.conf import settings
from django.db import models
from accounts.models import VendorProfile


# ─────────────────────────────────────────────────────────────────────────────
# Category
# ─────────────────────────────────────────────────────────────────────────────

class Category(models.Model):
    name          = models.CharField(max_length=100)
    slug          = models.SlugField(max_length=120, unique=True)
    description   = models.TextField(blank=True)
    image_url     = models.CharField(max_length=500, blank=True)
    icon_name     = models.CharField(max_length=50, blank=True)
    parent        = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='children',
    )
    sort_order    = models.PositiveIntegerField(default=0)
    is_active     = models.BooleanField(default=True)
    featured_color = models.CharField(max_length=30, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table          = 'categories'
        ordering          = ['sort_order', 'name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# Brand
# ─────────────────────────────────────────────────────────────────────────────

class Brand(models.Model):
    name        = models.CharField(max_length=100)
    slug        = models.SlugField(max_length=120, unique=True)
    logo_url    = models.CharField(max_length=500, blank=True)
    cover_url   = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    website     = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    country     = models.CharField(max_length=100, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brands'
        ordering = ['name']

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# Product
# ─────────────────────────────────────────────────────────────────────────────

class Product(models.Model):

    STATUS_CHOICES = [
        ('active',   'Active'),
        ('draft',    'Draft'),
        ('inactive', 'Inactive'),
    ]

    # Existing products ke liye temporarily nullable.
    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.PROTECT,
        related_name='products',
        null=True,
        blank=True,
    )

    external_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=200)

    slug = models.SlugField(
        max_length=220,
        unique=True,
    )

    # FK to Category (was IntegerField; safe migration in 0005)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )

    # FK to Brand (was IntegerField; safe migration in 0005)
    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )

    cost_price    = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    minimum_stock = models.PositiveIntegerField(default=0)
    weight        = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    meta_title    = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)

    sku               = models.CharField(max_length=100, unique=True)
    short_description = models.TextField(blank=True)
    description       = models.TextField(blank=True)

    price = models.DecimalField(max_digits=12, decimal_places=2)

    discount_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    stock       = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
    )

    class Meta:
        db_table = 'products'

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_price(self):
        return self.discount_price or self.price

    @property
    def in_stock(self):
        return self.stock > 0

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# ProductImage
# ─────────────────────────────────────────────────────────────────────────────

class ProductImage(models.Model):
    product    = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image      = models.CharField(max_length=500)      # URL or relative path under /public
    alt_text   = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.product.name} — image {self.id}'


# ─────────────────────────────────────────────────────────────────────────────
# ProductReview
# ─────────────────────────────────────────────────────────────────────────────

class ProductReview(models.Model):
    product              = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    user                 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='product_reviews',
    )
    rating               = models.PositiveSmallIntegerField()   # 1–5
    title                = models.CharField(max_length=200, blank=True)
    body                 = models.TextField(blank=True, db_column='comment')
    is_verified_purchase = models.BooleanField(default=False)
    is_approved          = models.BooleanField(default=True)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        db_table      = 'reviews'
        unique_together = ('product', 'user')
        ordering      = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.product.name} ({self.rating}★)'