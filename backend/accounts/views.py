from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import VendorProfile, Address, WishlistItem, BuyerProfile
from .serializers import (
    CustomerRegisterSerializer, VendorRegisterSerializer,
    VendorProfileSerializer, UserProfileSerializer,
    ElectroHubTokenSerializer,
    AddressSerializer, WishlistItemSerializer,
    BuyerProfileSerializer,
)

User = get_user_model()


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    serializer_class = ElectroHubTokenSerializer


class CustomerRegisterView(generics.CreateAPIView):
    serializer_class   = CustomerRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        user = self.get_serializer(data=request.data)
        user.is_valid(raise_exception=True)
        account = user.save()
        refresh = RefreshToken.for_user(account)
        return Response(
            {
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    {
                    'id':    account.id,
                    'email': account.email,
                    'name':  account.get_full_name(),
                    'role':  account.role.lower(),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class VendorRegisterView(generics.CreateAPIView):
    serializer_class   = VendorRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Vendor application submitted successfully. Your account is pending admin approval.',
                'user': {
                    'id':    user.id,
                    'email': user.email,
                    'name':  user.get_full_name(),
                    'role':  user.role.lower(),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class VendorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.vendor_profile


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    token = request.data.get('refresh')
    if token:
        try:
            RefreshToken(token).blacklist()
        except Exception:
            pass
    return Response({'message': 'Logged out successfully.'})


# ── Address ───────────────────────────────────────────────────────────────────

class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class   = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        is_default = serializer.validated_data.get('is_default', False)
        if is_default:
            # Unset any existing default
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        elif not Address.objects.filter(user=self.request.user).exists():
            # First address becomes default automatically
            is_default = True
        serializer.save(user=self.request.user, is_default=is_default)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save()


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def set_default_address(request, pk):
    try:
        addr = Address.objects.get(pk=pk, user=request.user)
    except Address.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
    addr.is_default = True
    addr.save(update_fields=['is_default', 'updated_at'])
    return Response(AddressSerializer(addr).data)


# ── Wishlist ──────────────────────────────────────────────────────────────────

class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class   = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            WishlistItem.objects
            .filter(user=self.request.user)
            .select_related('product__category', 'product__brand')
            .prefetch_related('product__images')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Return 200 if already in wishlist (idempotent)
        product_id = request.data.get('product')
        if WishlistItem.objects.filter(user=request.user, product_id=product_id).exists():
            item = WishlistItem.objects.get(user=request.user, product_id=product_id)
            return Response(WishlistItemSerializer(item).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_wishlist_item(request, product_id):
    deleted, _ = WishlistItem.objects.filter(
        user=request.user, product_id=product_id
    ).delete()
    if deleted:
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response({'detail': 'Not found.'}, status=404)


# ── BuyerProfile ──────────────────────────────────────────────────────────────

class BuyerProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/buyer-profile/ — retrieve (or auto-create) the caller's B2B company profile.
    PUT/PATCH /api/buyer-profile/ — update company details.
    """
    serializer_class   = BuyerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = BuyerProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'company_name': self.request.user.get_full_name() or self.request.user.email},
        )
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance   = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
