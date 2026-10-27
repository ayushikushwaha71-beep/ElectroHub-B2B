from django.urls import path
from .views import OrderListCreateView, OrderDetailView, VendorOrderListView, vendor_order_status, AdminOrderListCreateView, AdminOrderDetailView, mark_order_completed
urlpatterns = [
    path('', OrderListCreateView.as_view()), 
    path('admin/', AdminOrderListCreateView.as_view()),
    path('admin/<int:pk>/', AdminOrderDetailView.as_view()),
    path('vendor/', VendorOrderListView.as_view()), 
    path('vendor/<int:pk>/status/', vendor_order_status), 
    path('<int:pk>/', OrderDetailView.as_view()),
    path('<int:pk>/complete/', mark_order_completed)
]
