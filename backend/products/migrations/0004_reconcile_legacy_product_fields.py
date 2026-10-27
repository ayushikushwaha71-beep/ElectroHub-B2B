from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('products', '0003_seed_catalogue')]
    operations = [migrations.SeparateDatabaseAndState(
        database_operations=[],
        state_operations=[
            migrations.RemoveField(model_name='product', name='brand_name'),
            migrations.RemoveField(model_name='product', name='category_name'),
            migrations.AddField(model_name='product', name='brand_id', field=models.IntegerField(blank=True, db_column='brand_id', null=True)),
            migrations.AddField(model_name='product', name='category_id', field=models.IntegerField(blank=True, db_column='category_id', null=True)),
            migrations.AddField(model_name='product', name='cost_price', field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
            migrations.AddField(model_name='product', name='meta_description', field=models.TextField(blank=True)),
            migrations.AddField(model_name='product', name='meta_title', field=models.CharField(blank=True, max_length=255)),
            migrations.AddField(model_name='product', name='minimum_stock', field=models.PositiveIntegerField(default=0)),
            migrations.AddField(model_name='product', name='weight', field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        ],
    )]
