from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, VendorProfile

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
	ordering = ('-date_joined',)
	list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
	list_filter = ('role', 'is_active', 'is_staff')
	search_fields = ('email', 'first_name', 'last_name')
	filter_horizontal = ()
	fieldsets = (
		(None, {'fields': ('email', 'password')}),
		('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
		('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
		('ElectroHub', {'fields': ('role',)}),
	)
	add_fieldsets = (
		(None, {'classes': ('wide',), 'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role')}),
	)

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
	list_display = ('business_name', 'user', 'status', 'city', 'state', 'created_at')
	list_filter = ('status', 'state')
	search_fields = ('business_name', 'user__email', 'gstin')
	readonly_fields = ('created_at', 'updated_at')
