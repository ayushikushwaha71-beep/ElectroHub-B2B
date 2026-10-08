from django.db.models import Avg, Count, Q
from rest_framework import serializers
from .models import Category, Brand, Product, ProductImage, ProductReview


# ─────────────────────────────────────────────────────────────────────────────
# Category
# ─────────────────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    """
    Flat category representation.
    product_count is injected via annotation in the view's get_queryset.
    children is a lightweight list (no deep recursion).
    """
    product_count = serializers.IntegerField(read_only=True, default=0)
    children      = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = (
            'id', 'name', 'slug', 'description', 'image_url', 'icon_name',
            'parent', 'sort_order', 'is_active', 'featured_color',
            'product_count', 'children',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True).order_by('sort_order', 'name')
        return CategorySlimSerializer(qs, many=True).data


class CategorySlimSerializer(serializers.ModelSerializer):
    """Minimal serializer used for nested children — avoids deep recursion."""
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model  = Category
        fields = ('id', 'name', 'slug', 'image_url', 'icon_name',
                  'featured_color', 'sort_order', 'is_active', 'product_count')


# ─────────────────────────────────────────────────────────────────────────────
# Brand
# ─────────────────────────────────────────────────────────────────────────────

class BrandSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model  = Brand
        fields = (
            'id', 'name', 'slug', 'logo_url', 'cover_url', 'description',
            'website', 'is_featured', 'is_active', 'country',
            'product_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ─────────────────────────────────────────────────────────────────────────────
# ProductImage
# ─────────────────────────────────────────────────────────────────────────────

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary', 'sort_order', 'created_at')
        read_only_fields = ('id', 'created_at')


# ─────────────────────────────────────────────────────────────────────────────
# ProductReview
# ─────────────────────────────────────────────────────────────────────────────

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name     = serializers.SerializerMethodField()
    user_initials = serializers.SerializerMethodField()

    class Meta:
        model  = ProductReview
        fields = (
            'id', 'product', 'user', 'user_name', 'user_initials',
            'rating', 'title', 'body',
            'is_verified_purchase', 'is_approved',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'user', 'user_name', 'user_initials',
            'is_verified_purchase', 'is_approved',
            'created_at', 'updated_at',
        )

    def get_user_name(self, obj):
        name = obj.user.get_full_name()
        return name or obj.user.email.split('@')[0]

    def get_user_initials(self, obj):
        name = obj.user.get_full_name()
        if name:
            return ''.join(w[0].upper() for w in name.split()[:2])
        return obj.user.email[0].upper()

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value


# ─────────────────────────────────────────────────────────────────────────────
# ProductReview — write (create/update)
# ─────────────────────────────────────────────────────────────────────────────

class ProductReviewWriteSerializer(ProductReviewSerializer):
    """Exposes product as a write-only PK (set by the view from URL)."""
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True,
    )

    class Meta(ProductReviewSerializer.Meta):
        pass


# ─────────────────────────────────────────────────────────────────────────────
# Product (full)
# ─────────────────────────────────────────────────────────────────────────────

class ProductSerializer(serializers.ModelSerializer):
    # Nested read-only
    category   = CategorySlimSerializer(read_only=True)
    brand      = BrandSerializer(read_only=True)
    images     = ProductImageSerializer(many=True, read_only=True)

    # Write-only FK setters (accepted as integer IDs on POST/PATCH)
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=Category.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    brand_id = serializers.PrimaryKeyRelatedField(
        source='brand',
        queryset=Brand.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    # Computed fields
    final_price  = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    in_stock     = serializers.BooleanField(read_only=True)
    rating       = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    vendor_id    = serializers.IntegerField(source='vendor.id', read_only=True)
    vendor_name  = serializers.CharField(source='vendor.business_name', read_only=True)

    class Meta:
        model  = Product
        fields = (
            'id', 'name', 'slug', 'sku', 'external_id',
            'category', 'category_id',
            'brand',    'brand_id',
            'short_description', 'description',
            'price', 'discount_price', 'final_price',
            'stock', 'in_stock',
            'is_featured', 'is_trending', 'is_active', 'status',
            'images',
            'rating', 'review_count',
            'vendor_id', 'vendor_name',
            'weight', 'meta_title', 'meta_description',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'vendor_id', 'vendor_name',
            'created_at', 'updated_at',
        )

    def get_rating(self, obj):
        result = obj.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))
        avg = result.get('avg')
        return round(float(avg), 1) if avg is not None else None

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


# ─────────────────────────────────────────────────────────────────────────────
# Product (slim — used in wishlist / order-item contexts)
# ─────────────────────────────────────────────────────────────────────────────

class ProductSlimSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    brand_name    = serializers.SerializerMethodField()
    images        = ProductImageSerializer(many=True, read_only=True)
    final_price   = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    in_stock      = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Product
        fields = (
            'id', 'name', 'slug', 'sku',
            'category_name', 'brand_name',
            'price', 'discount_price', 'final_price',
            'stock', 'in_stock',
            'is_featured', 'is_trending', 'status',
            'images',
        )

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_brand_name(self, obj):
        return obj.brand.name if obj.brand else None
