from django.conf import settings
from django.db import models
from products.models import Product
from accounts.models import VendorProfile

class Order(models.Model):
    STATUS_CHOICES = [('pending','Pending'),('processing','Processing'),('shipped','Shipped'),('completed','Completed'),('cancelled','Cancelled')]
    order_number = models.CharField(max_length=30, unique=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='orders', db_column='user_id')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.BooleanField(default=False)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    email = models.EmailField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10, db_column='postal_code')
    country = models.CharField(max_length=100, default='India')
    notes = models.TextField(blank=True)
    payment_method = models.CharField(max_length=30, default='cod')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_items')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.PROTECT, related_name='order_items', null=True, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, db_column='price')
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'order_items'

