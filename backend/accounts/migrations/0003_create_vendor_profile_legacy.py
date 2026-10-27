from django.db import migrations


def create_vendor_profile_table(apps, schema_editor):
    VendorProfile = apps.get_model('accounts', 'VendorProfile')
    if 'accounts_vendorprofile' not in schema_editor.connection.introspection.table_names():
        schema_editor.create_model(VendorProfile)


class Migration(migrations.Migration):
    dependencies = [('accounts', '0002_alter_customuser_options_alter_customuser_phone_and_more')]
    operations = [migrations.RunPython(create_vendor_profile_table, migrations.RunPython.noop)]
