from django.db import migrations, models
from django.contrib.auth.hashers import make_password

VENDORS = ('Techtron Electronics', 'RoboParts India', 'CircuitHub Technologies', 'Embedded World', 'Maker Components')

def reconcile_products(apps, schema_editor):
    connection = schema_editor.connection
    User = apps.get_model('accounts', 'CustomUser')
    VendorProfile = apps.get_model('accounts', 'VendorProfile')
    Product = apps.get_model('products', 'Product')
    User._meta.db_table = 'accounts_user'
    VendorProfile._meta.db_table = 'accounts_vendorprofile'
    Product._meta.db_table = 'products'
    columns = [column.name for column in connection.introspection.get_table_description(connection.cursor(), 'products')]
    if 'vendor_id' not in columns:
        field = Product._meta.get_field('vendor')
        field.null = True
        field.remote_field.model._meta.db_table = 'accounts_vendorprofile'
        schema_editor.add_field(Product, field)
    vendors = []
    for index, business_name in enumerate(VENDORS):
        email = f'seed-{index}@electrohub.local'
        user = User.objects.filter(email=email).first()
        if user is None:
            cursor = connection.cursor()
            cursor.execute(
                '''INSERT INTO accounts_user
                (password, is_superuser, first_name, last_name, email,
                 phone_number, profile_image, bio, gender, date_of_birth, role,
                 is_active, is_staff, is_verified, is_email_verified,
                 is_phone_verified, last_login, date_joined, updated_at)
                VALUES (%s, FALSE, %s, '', %s, NULL, '', NULL, NULL, NULL,
                        'VENDOR', TRUE, FALSE, FALSE, FALSE, FALSE, NULL,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id''',
                [make_password('!seed-only!'), business_name.split()[0], email],
            )
            user = User(id=cursor.fetchone()[0])
        vendor, _ = VendorProfile.objects.get_or_create(user_id=user.id, defaults={'business_name': business_name, 'city': 'Bengaluru', 'status': 'approved'})
        vendors.append(vendor)
    for index, product in enumerate(Product.objects.only('id').filter(vendor__isnull=True).order_by('id')):
        Product.objects.filter(pk=product.pk).update(vendor_id=vendors[index % len(vendors)].pk)

def reverse_reconcile(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [('products', '0002_product_external_id'), ('accounts', '0003_create_vendor_profile_legacy')]
    operations = [migrations.SeparateDatabaseAndState(
        database_operations=[migrations.RunPython(reconcile_products, reverse_reconcile)],
        state_operations=[
            migrations.AlterModelTable(name='product', table='products'),
            migrations.AlterField(model_name='product', name='vendor', field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.PROTECT, related_name='products', to='accounts.vendorprofile')),
            migrations.RemoveField(model_name='product', name='image'),
            migrations.RemoveField(model_name='product', name='specifications'),
        ],
    )]
