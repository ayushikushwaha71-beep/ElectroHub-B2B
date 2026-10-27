from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers as drf_serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Brand, Product, ProductImage, ProductReview
from .serializers import (
    CategorySerializer, CategorySlimSerializer,
    BrandSerializer,
    ProductSerializer,
    ProductImageSerializer,
    ProductReviewSerializer, ProductReviewWriteSerializer,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def approved_vendor(user):
    return (
        user.is_authenticated
        and getattr(user, 'role', '').lower() == 'vendor'
        and getattr(getattr(user, 'vendor_profile', None), 'status', None) == 'approved'
    )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can write; anyone can read."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (
            request.user.is_staff
            or getattr(request.user, 'role', '').lower() == 'admin'
        )


# ─────────────────────────────────────────────────────────────────────────────
# Category views
# ─────────────────────────────────────────────────────────────────────────────

class CategoryListView(generics.ListCreateAPIView):
    """
    GET  /api/products/categories/  — public list of active categories
    POST /api/products/categories/  — admin only
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'slug']

    def get_queryset(self):
        qs = Category.objects.annotate(
            product_count=Count(
                'products',
                filter=Q(products__is_active=True),
            )
        ).select_related('parent')

        # ?all=true returns all including inactive (admin only)
        if self.request.query_params.get('all', '').lower() != 'true':
            qs = qs.filter(is_active=True)

        # ?parent=<id> or ?top_level=true
        parent_id = self.request.query_params.get('parent')
        if parent_id == 'null' or self.request.query_params.get('top_level') == 'true':
            qs = qs.filter(parent=None)
        elif parent_id:
            qs = qs.filter(parent_id=parent_id)

        return qs


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET /api/products/categories/<slug>/  — public"""
    serializer_class   = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field       = 'slug'

    def get_queryset(self):
        return Category.objects.annotate(
            product_count=Count(
                'products',
                filter=Q(products__is_active=True),
            )
        )


# ─────────────────────────────────────────────────────────────────────────────
# Brand views
# ─────────────────────────────────────────────────────────────────────────────

class BrandListView(generics.ListCreateAPIView):
    """
    GET  /api/products/brands/  — public list of brands
    POST /api/products/brands/  — admin only
    """
    serializer_class   = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [SearchFilter]
    search_fields      = ['name', 'slug']

    def get_queryset(self):
        qs = Brand.objects.annotate(
            product_count=Count(
                'products',
                filter=Q(products__is_active=True),
            )
        )

        if self.request.query_params.get('all', '').lower() != 'true':
            qs = qs.filter(is_active=True)

        if self.request.query_params.get('featured') == 'true':
            qs = qs.filter(is_featured=True)

        return qs


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET /api/products/brands/<slug>/"""
    serializer_class   = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field       = 'slug'

    def get_queryset(self):
        return Brand.objects.annotate(
            product_count=Count(
                'products',
                filter=Q(products__is_active=True),
            )
        )


# ─────────────────────────────────────────────────────────────────────────────
# Product views
# ─────────────────────────────────────────────────────────────────────────────

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    filter_backends  = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields    = ['name', 'sku', 'short_description']
    ordering_fields  = ['price', 'discount_price', 'created_at', 'stock']
    ordering         = ['-created_at']
    filterset_fields = ['category', 'brand', 'status', 'is_featured', 'is_trending']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = (
            Product.objects
            .filter(is_active=True)
            .select_related('vendor', 'category', 'brand')
            .prefetch_related('images', 'reviews')
        )

        # ?vendor=<vendor_profile_id>
        vendor_id = self.request.query_params.get('vendor')
        if vendor_id:
            qs = qs.filter(vendor_id=vendor_id)

        # ?in_stock=true
        if self.request.query_params.get('in_stock', '').lower() == 'true':
            qs = qs.filter(stock__gt=0)

        # ?featured=true (alias)
        if self.request.query_params.get('featured', '').lower() == 'true':
            qs = qs.filter(is_featured=True)

        # ?category_slug=<slug> — alternate filter by category slug
        cat_slug = self.request.query_params.get('category_slug')
        if cat_slug:
            qs = qs.filter(category__slug=cat_slug)

        # ?brand_slug=<slug>
        brand_slug = self.request.query_params.get('brand_slug')
        if brand_slug:
            qs = qs.filter(brand__slug=brand_slug)

        return qs

    def perform_create(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can create products.')
        serializer.save(vendor=self.request.user.vendor_profile)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    lookup_field     = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        base = Product.objects.select_related('vendor', 'category', 'brand').prefetch_related('images', 'reviews')
        if self.request.method == 'GET':
            return base.filter(is_active=True)
        return base.filter(vendor__user=self.request.user)

    def perform_update(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can edit products.')
        serializer.save()

    def perform_destroy(self, instance):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can delete products.')
        instance.is_active = False
        instance.status    = 'inactive'
        instance.save(update_fields=['is_active', 'status'])


class VendorProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return (
            Product.objects
            .filter(vendor__user=self.request.user)
            .select_related('vendor', 'category', 'brand')
            .prefetch_related('images', 'reviews')
        )

    def perform_create(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can create products.')
        serializer.save(vendor=self.request.user.vendor_profile)


# ─────────────────────────────────────────────────────────────────────────────
# ProductImage views
# ─────────────────────────────────────────────────────────────────────────────

class ProductImageListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/products/<slug>/images/  — public
    POST /api/products/<slug>/images/  — approved vendor (product owner)
    """
    serializer_class = ProductImageSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_product(self):
        return get_object_or_404(Product, slug=self.kwargs['slug'])

    def get_queryset(self):
        product = self.get_product()
        return ProductImage.objects.filter(product=product)

    def perform_create(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can upload product images.')
        product = self.get_product()
        if product.vendor and product.vendor.user != self.request.user:
            raise PermissionDenied('You can only manage images for your own products.')
        serializer.save(product=product)


class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH / DELETE /api/products/<slug>/images/<pk>/
    """
    serializer_class = ProductImageSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        return ProductImage.objects.filter(product=product)

    def perform_update(self, serializer):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can update product images.')
        serializer.save()

    def perform_destroy(self, instance):
        if not approved_vendor(self.request.user):
            raise PermissionDenied('Only approved vendors can delete product images.')
        instance.delete()


# ─────────────────────────────────────────────────────────────────────────────
# ProductReview views
# ─────────────────────────────────────────────────────────────────────────────

class ProductReviewListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/products/<slug>/reviews/  — public (approved reviews only)
    POST /api/products/<slug>/reviews/  — authenticated customers only (one per product)
    """
    filter_backends  = [OrderingFilter]
    ordering_fields  = ['created_at', 'rating']
    ordering         = ['-created_at']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return ProductReviewWriteSerializer if self.request.method == 'POST' else ProductReviewSerializer

    def get_product(self):
        return get_object_or_404(Product, slug=self.kwargs['slug'])

    def get_queryset(self):
        product = self.get_product()
        return (
            ProductReview.objects
            .filter(product=product, is_approved=True)
            .select_related('user')
        )

    def create(self, request, *args, **kwargs):
        product = self.get_product()

        # Only one review per user per product
        if ProductReview.objects.filter(product=product, user=request.user).exists():
            return Response(
                {'detail': 'You have already reviewed this product.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Detect verified purchase
        from orders.models import OrderItem
        is_verified = OrderItem.objects.filter(
            order__customer=request.user,
            order__status__in=['delivered', 'completed'],
            product=product,
        ).exists()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            product=product,
            user=request.user,
            is_verified_purchase=is_verified,
        )
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ProductReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET  — public
    PATCH / DELETE — review owner or admin
    """
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        return ProductReview.objects.filter(product=product).select_related('user')

    def _check_owner_or_admin(self):
        obj = self.get_object()
        user = self.request.user
        if obj.user != user and not (user.is_staff or getattr(user, 'role', '').lower() == 'admin'):
            raise PermissionDenied('You can only edit your own reviews.')
        return obj

    def perform_update(self, serializer):
        self._check_owner_or_admin()
        serializer.save()

    def perform_destroy(self, instance):
        self._check_owner_or_admin()
        instance.delete()
