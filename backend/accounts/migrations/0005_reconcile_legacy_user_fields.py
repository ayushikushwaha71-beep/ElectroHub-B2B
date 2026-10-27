from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('accounts', '0004_alter_customuser_options')]
    operations = [migrations.SeparateDatabaseAndState(
        database_operations=[],
        state_operations=[
            migrations.AddField(model_name='customuser', name='profile_image', field=models.CharField(blank=True, default='', max_length=255)),
            migrations.AddField(model_name='customuser', name='bio', field=models.TextField(blank=True, null=True)),
            migrations.AddField(model_name='customuser', name='gender', field=models.CharField(blank=True, max_length=20, null=True)),
            migrations.AddField(model_name='customuser', name='date_of_birth', field=models.DateField(blank=True, null=True)),
            migrations.AddField(model_name='customuser', name='is_verified', field=models.BooleanField(default=False)),
            migrations.AddField(model_name='customuser', name='is_email_verified', field=models.BooleanField(default=False)),
            migrations.AddField(model_name='customuser', name='is_phone_verified', field=models.BooleanField(default=False)),
            migrations.AddField(model_name='customuser', name='updated_at', field=models.DateTimeField(blank=True, null=True)),
        ],
    )]
