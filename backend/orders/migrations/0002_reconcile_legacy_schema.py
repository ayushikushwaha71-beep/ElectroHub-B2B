from django.db import migrations, models
import django.db.models.deletion


def add_vendor_column(apps, schema_editor):
    table_names = schema_editor.connection.introspection.table_names()
    if 'vendor_id' in [column.name for column in schema_editor.connection.introspection.get_table_description(schema_editor.connection.cursor(), 'order_items')]:
        return
    OrderItem = apps.get_model('orders', 'OrderItem')
    OrderItem._meta.db_table = 'order_items'
    field = OrderItem._meta.get_field('vendor')
    field.null = True
    field.remote_field.model._meta.db_table = 'accounts_vendorprofile'
    schema_editor.add_field(OrderItem, field)


class Migration(migrations.Migration):
    dependencies = [('orders', '0001_initial'), ('accounts', '0003_create_vendor_profile_legacy'), ('products', '0003_seed_catalogue')]
    operations = [migrations.SeparateDatabaseAndState(
        database_operations=[migrations.RunPython(add_vendor_column, migrations.RunPython.noop)],
        state_operations=[
            migrations.AlterModelTable(name='order', table='orders'),
            migrations.AlterModelTable(name='orderitem', table='order_items'),
            migrations.AlterField(model_name='order', name='customer', field=models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.PROTECT, related_name='orders', to='accounts.customuser')),
            migrations.AlterField(model_name='order', name='pincode', field=models.CharField(db_column='postal_code', max_length=10)),
            migrations.AddField(model_name='order', name='payment_status', field=models.BooleanField(default=False)),
            migrations.AddField(model_name='order', name='subtotal', field=models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            migrations.AddField(model_name='order', name='tax', field=models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            migrations.AddField(model_name='order', name='shipping_charge', field=models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            migrations.AddField(model_name='order', name='discount', field=models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            migrations.AddField(model_name='order', name='country', field=models.CharField(default='India', max_length=100)),
            migrations.AddField(model_name='order', name='notes', field=models.TextField(blank=True)),
            migrations.AlterField(model_name='orderitem', name='unit_price', field=models.DecimalField(db_column='price', decimal_places=2, max_digits=12)),
            migrations.AlterField(model_name='orderitem', name='vendor', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='order_items', to='accounts.vendorprofile')),
            migrations.AlterModelOptions(name='order', options={'ordering': ['-created_at']}),
        ],
    )]
