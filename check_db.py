import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electrohub_backend.settings')
django.setup()

from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT app, name, applied FROM django_migrations WHERE app='quotations';")
print(cursor.fetchall())

cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='rfqs';")
print("Columns in rfqs:")
for row in cursor.fetchall():
    print("- " + row[0])
