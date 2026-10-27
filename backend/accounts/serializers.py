from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import VendorProfile, Address, WishlistItem, BuyerProfile

User = get_user_model()


class ElectroHubTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.lower()
        token['name'] = user.get_full_name() or user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id':   self.user.id,
            'email': self.user.email,
            'name':  self.user.get_full_name() or self.user.email,
            'role':  self.user.role.lower(),
        }
        return data


class CustomerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'confirm_password', 'phone')

    def validate(self, attrs):
        if attrs.pop('password') != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        attrs['password_value'] = self.initial_data['password']
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password_value')
        return User.objects.create_user(role=User.Role.CUSTOMER, password=password, **validated_data)


class VendorRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    business_name = serializers.CharField()
    business_address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    pincode = serializers.CharField(required=False, allow_blank=True)
    gstin = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, data):
        password = data.pop('password')
        profile_data = {key: data.pop(key, '') for key in
                        ('business_name', 'business_address', 'city', 'state', 'pincode', 'gstin', 'description')}
        user = User.objects.create_user(password=password, role=User.Role.VENDOR, **data)
        VendorProfile.objects.create(user=user, **profile_data)
        return user


class VendorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    name  = serializers.SerializerMethodField()

    class Meta:
        model = VendorProfile
        fields = (
            'id', 'email', 'name',
            'business_name', 'business_address', 'city', 'state', 'pincode',
            'gstin', 'description', 'website',
            'status', 'rejection_reason',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'rejection_reason', 'created_at', 'updated_at')

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone',
            'role', 'date_joined', 'gender', 'date_of_birth',
        )
        read_only_fields = ('id', 'email', 'role', 'date_joined')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Address
        fields = (
            'id', 'type', 'label',
            'first_name', 'last_name', 'phone',
            'line1', 'line2', 'city', 'state', 'pincode', 'country',
            'is_default', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class WishlistItemSerializer(serializers.ModelSerializer):
    from products.serializers import ProductSlimSerializer as _ProductSlimSerializer
    product_data = _ProductSlimSerializer(source='product', read_only=True)

    class Meta:
        model  = WishlistItem
        fields = ('id', 'product', 'product_data', 'added_at')
        read_only_fields = ('id', 'product_data', 'added_at')


# ── BuyerProfile ──────────────────────────────────────────────────────────────

class BuyerProfileSerializer(serializers.ModelSerializer):
    """B2B buyer company profile — get or create for authenticated customer."""
    email = serializers.EmailField(source='user.email', read_only=True)
    name  = serializers.SerializerMethodField()

    class Meta:
        model  = BuyerProfile
        fields = (
            'id', 'email', 'name',
            'company_name', 'gstin', 'pan',
            'billing_line1', 'billing_line2', 'billing_city',
            'billing_state', 'billing_pincode', 'billing_country',
            'credit_limit', 'payment_terms',
            'contact_person', 'contact_phone', 'contact_email',
            'is_verified', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'email', 'name', 'is_verified', 'credit_limit',
            'created_at', 'updated_at',
        )

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def create(self, validated_data):
        user = self.context['request'].user
        profile, _ = BuyerProfile.objects.get_or_create(user=user, defaults=validated_data)
        return profile

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
