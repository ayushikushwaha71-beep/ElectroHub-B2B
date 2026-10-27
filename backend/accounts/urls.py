from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, CustomerRegisterView, VendorRegisterView,
    VendorProfileView, UserProfileView, logout_view,
    AddressListCreateView, AddressDetailView, set_default_address,
    WishlistListCreateView, remove_wishlist_item,
    BuyerProfileView,
)

urlpatterns = [
    # Auth
    path('login/',          LoginView.as_view()),
    path('token/refresh/',  TokenRefreshView.as_view()),
    path('register/',       CustomerRegisterView.as_view()),
    path('vendor/register/', VendorRegisterView.as_view()),
    path('logout/',         logout_view),

    # Profile
    path('profile/',        UserProfileView.as_view()),
    path('vendor/profile/', VendorProfileView.as_view()),

    # Addresses
    path('addresses/',               AddressListCreateView.as_view(), name='address-list-create'),
    path('addresses/<int:pk>/',      AddressDetailView.as_view(),     name='address-detail'),
    path('addresses/<int:pk>/set-default/', set_default_address,     name='address-set-default'),

    # Wishlist
    path('wishlist/',                    WishlistListCreateView.as_view(), name='wishlist-list-create'),
    path('wishlist/<int:product_id>/',   remove_wishlist_item,             name='wishlist-remove'),

    # Buyer (B2B) Profile
    path('buyer-profile/', BuyerProfileView.as_view(), name='buyer-profile'),
]
