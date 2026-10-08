from django.urls import path
from .views import (
    # Categories
    CategoryListView, CategoryDetailView,
    # Brands
    BrandListView, BrandDetailView,
    # Products
    ProductListView, ProductDetailView, VendorProductListView,
    # Images
    ProductImageListCreateView, ProductImageDetailView,
    # Reviews
    ProductReviewListCreateView, ProductReviewDetailView,
)

urlpatterns = [
    # ── Categories ─────────────────────────────────────────────────────────
    path('categories/',          CategoryListView.as_view(),   name='category-list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category-detail'),

    # ── Brands ─────────────────────────────────────────────────────────────
    path('brands/',              BrandListView.as_view(),      name='brand-list'),
    path('brands/<slug:slug>/',  BrandDetailView.as_view(),    name='brand-detail'),

    # ── Products ────────────────────────────────────────────────────────────
    path('vendor/',              VendorProductListView.as_view(),               name='vendor-product-list'),
    path('',                     ProductListView.as_view(),                     name='product-list'),
    path('<slug:slug>/',         ProductDetailView.as_view(),                   name='product-detail'),

    # ── Product Images ──────────────────────────────────────────────────────
    path('<slug:slug>/images/',         ProductImageListCreateView.as_view(), name='product-image-list'),
    path('<slug:slug>/images/<int:pk>/', ProductImageDetailView.as_view(),   name='product-image-detail'),

    # ── Product Reviews ─────────────────────────────────────────────────────
    path('<slug:slug>/reviews/',         ProductReviewListCreateView.as_view(), name='product-review-list'),
    path('<slug:slug>/reviews/<int:pk>/', ProductReviewDetailView.as_view(),   name='product-review-detail'),
]
