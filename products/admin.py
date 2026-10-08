from django.contrib import admin
from .models import Category, Brand, Product, ProductImage, ProductReview


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display    = ('name', 'slug', 'parent', 'sort_order', 'is_active')
    list_filter     = ('is_active', 'parent')
    search_fields   = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering        = ('sort_order', 'name')


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display    = ('name', 'slug', 'is_featured', 'is_active', 'country')
    list_filter     = ('is_featured', 'is_active')
    search_fields   = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering        = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display    = ('name', 'sku', 'category', 'brand', 'price', 'discount_price', 'stock', 'status', 'is_active')
    list_filter     = ('status', 'is_active', 'is_featured', 'is_trending', 'category', 'brand')
    search_fields   = ('name', 'sku', 'slug', 'external_id')
    prepopulated_fields = {'slug': ('name',)}
    ordering        = ('-created_at',)
    raw_id_fields   = ('vendor',)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display  = ('product', 'image', 'is_primary', 'sort_order')
    list_filter   = ('is_primary',)
    raw_id_fields = ('product',)
    ordering      = ('sort_order', 'id')


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display  = ('product', 'user', 'rating', 'is_verified_purchase', 'is_approved', 'created_at')
    list_filter   = ('is_approved', 'is_verified_purchase', 'rating')
    search_fields = ('product__name', 'user__email', 'title')
    raw_id_fields = ('product', 'user')
    ordering      = ('-created_at',)
