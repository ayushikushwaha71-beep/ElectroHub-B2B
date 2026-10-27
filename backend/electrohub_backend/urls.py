from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/admin/', include('accounts.admin_urls')),
    # Quotation Maker
    path('api/quotations/', include('quotations.urls')),
    path('api/admin/', include('quotations.admin_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
