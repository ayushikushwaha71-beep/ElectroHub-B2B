from django.urls import path
from .admin_views import AdminVendorListView, approve_vendor, reject_vendor, suspend_vendor
urlpatterns = [path('vendors/', AdminVendorListView.as_view()), path('vendors/<int:vendor_id>/approve/', approve_vendor), path('vendors/<int:vendor_id>/reject/', reject_vendor), path('vendors/<int:vendor_id>/suspend/', suspend_vendor)]
