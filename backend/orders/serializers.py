from django.db import transaction
from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name',          read_only=True)
    product_sku   = serializers.CharField(source='product.sku',           read_only=True)
    product_image = serializers.SerializerMethodField()
    vendor_name   = serializers.CharField(source='vendor.business_name',  read_only=True)

    class Meta:
        model  = OrderItem
        fields = (
            'id', 'product', 'product_name', 'product_sku', 'product_image',
            'vendor', 'vendor_name',
            'quantity', 'unit_price', 'total_price',
        )

    def get_product_image(self, obj):
        """Return the primary image URL for the order item's product."""
        img = (
            obj.product.images.filter(is_primary=True).first()
            or obj.product.images.first()
        )
        return img.image if img else ''


class OrderSerializer(serializers.ModelSerializer):
    items            = OrderItemSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()
    payment_status   = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = (
            'id', 'order_number', 'customer', 'status',
            'total_amount', 'subtotal', 'tax', 'shipping_charge', 'discount',
            'full_name', 'phone', 'email',
            'address', 'city', 'state', 'pincode',
            'payment_method', 'payment_status',
            'shipping_address',
            'items',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'order_number', 'customer', 'status', 'total_amount',
            'items', 'created_at', 'updated_at',
        )

    def get_shipping_address(self, obj):
        """Structured shipping address object for the frontend."""
        parts = (obj.full_name or '').split(' ', 1)
        return {
            'firstName': parts[0],
            'lastName':  parts[1] if len(parts) > 1 else '',
            'phone':     obj.phone or '',
            'line1':     obj.address or '',
            'city':      obj.city or '',
            'state':     obj.state or '',
            'pincode':   obj.pincode or '',
            'country':   getattr(obj, 'country', 'India'),
        }

    def get_payment_status(self, obj):
        """Convert boolean payment_status field to string."""
        return 'paid' if obj.payment_status else 'pending'


# ── Vendor-scoped serializer ──────────────────────────────────────────────────
# Returns only the OrderItems that belong to the requesting vendor.

class VendorOrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name',         read_only=True)
    product_sku   = serializers.CharField(source='product.sku',          read_only=True)
    product_image = serializers.SerializerMethodField()
    vendor_name   = serializers.CharField(source='vendor.business_name', read_only=True)

    class Meta:
        model  = OrderItem
        fields = (
            'id', 'product', 'product_name', 'product_sku', 'product_image',
            'vendor', 'vendor_name',
            'quantity', 'unit_price', 'total_price',
        )

    def get_product_image(self, obj):
        img = (
            obj.product.images.filter(is_primary=True).first()
            or obj.product.images.first()
        )
        return img.image if img else ''


class VendorOrderSerializer(serializers.ModelSerializer):
    """
    Like OrderSerializer but filters `items` to only those belonging
    to the vendor identified by context['vendor_profile'].
    """
    items            = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()
    payment_status   = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = (
            'id', 'order_number', 'customer', 'status',
            'total_amount', 'subtotal', 'tax', 'shipping_charge', 'discount',
            'full_name', 'phone', 'email',
            'address', 'city', 'state', 'pincode',
            'payment_method', 'payment_status',
            'shipping_address',
            'items',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'order_number', 'customer', 'status', 'total_amount',
            'items', 'created_at', 'updated_at',
        )

    def get_items(self, obj):
        vendor_profile = self.context.get('vendor_profile')
        qs = obj.items.filter(vendor=vendor_profile) if vendor_profile else obj.items.all()
        return VendorOrderItemSerializer(qs, many=True).data

    def get_shipping_address(self, obj):
        parts = (obj.full_name or '').split(' ', 1)
        return {
            'firstName': parts[0],
            'lastName':  parts[1] if len(parts) > 1 else '',
            'phone':     obj.phone or '',
            'line1':     obj.address or '',
            'city':      obj.city or '',
            'state':     obj.state or '',
            'pincode':   obj.pincode or '',
            'country':   getattr(obj, 'country', 'India'),
        }

    def get_payment_status(self, obj):
        return 'paid' if obj.payment_status else 'pending'


class CreateOrderSerializer(serializers.Serializer):
    """
    Write-only serializer for creating orders.
    Uses plain Serializer (not ModelSerializer) so that the write_only
    ListField is preserved correctly in validated_data on all Python versions.
    """
    full_name      = serializers.CharField(max_length=150)
    phone          = serializers.CharField(max_length=30)
    email          = serializers.EmailField()
    address        = serializers.CharField()
    city           = serializers.CharField(max_length=100)
    state          = serializers.CharField(max_length=100)
    pincode        = serializers.CharField(max_length=10)
    payment_method = serializers.CharField(max_length=30, default='cod')
    items          = serializers.ListField(child=serializers.DictField())

    def create(self, validated_data):
        raw_items = validated_data.pop('items')
        if not raw_items:
            raise serializers.ValidationError({'items': 'At least one item is required.'})

        with transaction.atomic():
            order = Order.objects.create(
                customer=self.context['request'].user,
                order_number=f"EH-{Order.objects.count() + 10001}",
                **validated_data,
            )

            total = 0
            products_to_update = []

            for raw in raw_items:
                # ── Resolve product ───────────────────────────────────────
                product = None
                raw_id  = raw.get('product_id')

                try:
                    pk      = int(raw_id)
                    product = (
                        Product.objects
                        .select_related('vendor')
                        .prefetch_related('images')
                        .filter(pk=pk, is_active=True)
                        .first()
                    )
                except (TypeError, ValueError):
                    pass

                if product is None and raw_id is not None:
                    try:
                        product = (
                            Product.objects
                            .select_related('vendor')
                            .prefetch_related('images')
                            .get(external_id=str(raw_id), is_active=True)
                        )
                    except Product.DoesNotExist:
                        pass

                if product is None:
                    raise serializers.ValidationError(
                        {'items': f'Product "{raw_id}" not found or inactive.'}
                    )

                # ── Validate quantity ─────────────────────────────────────
                try:
                    quantity = int(raw.get('quantity', 1))
                except (TypeError, ValueError):
                    raise serializers.ValidationError(
                        {'items': f'Invalid quantity for product "{raw_id}".'}
                    )

                if quantity < 1:
                    raise serializers.ValidationError(
                        {'items': f'Quantity for "{product.name}" must be at least 1.'}
                    )
                if quantity > product.stock:
                    raise serializers.ValidationError(
                        {'items': f'Only {product.stock} units of "{product.name}" are in stock.'}
                    )

                # ── Create order item ─────────────────────────────────────
                unit_price = product.final_price
                line_total = unit_price * quantity
                OrderItem.objects.create(
                    order       = order,
                    product     = product,
                    vendor      = product.vendor,
                    quantity    = quantity,
                    unit_price  = unit_price,
                    total_price = line_total,
                )
                total += line_total

                product.stock -= quantity
                products_to_update.append(product)

            # ── Persist stock changes ─────────────────────────────────────
            for product in products_to_update:
                product.save(update_fields=['stock', 'updated_at'])

            # ── Finalise order totals ─────────────────────────────────────
            order.total_amount = total
            order.subtotal     = total
            order.save(update_fields=['total_amount', 'subtotal'])

        return order
