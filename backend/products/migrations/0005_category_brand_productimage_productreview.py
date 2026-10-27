"""
Migration 0005 — Reconcile Category, Brand, ProductImage, ProductReview

The PostgreSQL database already has:
  - 'categories'      table (id, name, slug, image, description, is_active, created_at, updated_at)
  - 'brands'          table (id, name, slug, logo, description, website, is_active, created_at, updated_at)
  - 'product_images'  table (id, product_id FK, image, alt_text, is_primary, sort_order, created_at)
  - 'reviews'         table (id, product_id FK, user_id FK, rating, title, comment, is_verified_purchase,
                              is_approved, likes, dislikes, created_at, updated_at)
  - products.category_id → bigint FK → categories.id  (already in place!)
  - products.brand_id    → bigint FK → brands.id       (already in place!)

This migration:
  1. Adds missing enrichment columns to 'categories' (icon_name, sort_order, featured_color, parent_id).
  2. Adds missing enrichment columns to 'brands' (logo_url alias mapped in model, is_featured, country, cover_url).
  3. Declares ORM state for Category, Brand (pointing to existing tables).
  4. Converts Product.category_id / brand_id state from IntegerField to ForeignKey
     (no DB change — FK constraint already exists).
  5. Declares ORM state for ProductImage (pointing to existing 'product_images' table).
  6. Declares ORM state for ProductReview (pointing to existing 'reviews' table,
     body field uses db_column='comment').
  7. Seeds any missing category / brand rows.
  8. Seeds ProductImages for products that have none.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


# ── Seed data ─────────────────────────────────────────────────────────────────

CATEGORY_SEED = [
    {'id': 1, 'name': 'Arduino',         'slug': 'arduino',          'description': 'Arduino microcontroller boards and accessories', 'icon_name': 'cpu',      'sort_order': 1, 'featured_color': '#00979D', 'is_active': True},
    {'id': 2, 'name': 'Raspberry Pi',    'slug': 'raspberry-pi',     'description': 'Raspberry Pi single-board computers',            'icon_name': 'server',   'sort_order': 2, 'featured_color': '#C51A4A', 'is_active': True},
    {'id': 3, 'name': 'ESP32 / ESP8266', 'slug': 'esp',              'description': 'Espressif WiFi and Bluetooth modules',            'icon_name': 'wifi',     'sort_order': 3, 'featured_color': '#E7471D', 'is_active': True},
    {'id': 4, 'name': 'Sensors',         'slug': 'sensors',          'description': 'Temperature, humidity, motion and other sensors', 'icon_name': 'activity', 'sort_order': 4, 'featured_color': '#7C3AED', 'is_active': True},
    {'id': 5, 'name': 'Motors',          'slug': 'motors-actuators', 'description': 'Stepper motors, servo motors, H-bridge drivers',  'icon_name': 'zap',      'sort_order': 5, 'featured_color': '#2563EB', 'is_active': True},
    {'id': 6, 'name': 'Displays',        'slug': 'displays',         'description': 'OLED, LCD and TFT display modules',               'icon_name': 'monitor',  'sort_order': 6, 'featured_color': '#059669', 'is_active': True},
]

BRAND_SEED = [
    {'id': 1, 'name': 'Arduino',      'slug': 'arduino-brand',      'website': 'https://www.arduino.cc',        'is_featured': True,  'country': 'Italy', 'is_active': True},
    {'id': 2, 'name': 'Raspberry Pi', 'slug': 'raspberry-pi-brand', 'website': 'https://www.raspberrypi.com',   'is_featured': True,  'country': 'UK',    'is_active': True},
    {'id': 3, 'name': 'Espressif',    'slug': 'espressif',          'website': 'https://www.espressif.com',     'is_featured': True,  'country': 'China', 'is_active': True},
    {'id': 4, 'name': 'Generic',      'slug': 'generic',            'website': '',                              'is_featured': False, 'country': 'India', 'is_active': True},
]

SLUG_IMAGE_MAP = {
    'arduino-uno-r3':                         '/images/products/arduino-uno-r4-wifi.jpg',
    'arduino-nano':                           '/images/products/arduino-nano-every.png',
    'raspberry-pi-5-8gb':                     '/images/products/raspberry-pi-5.svg',
    'esp32-wifi-bluetooth-development-board': '/images/products/esp32-s3-devkit-c.svg',
    'hc-sr04-ultrasonic-sensor':             '/images/products/dht22-temperature-humidity-sensor.svg',
    'dc-gear-motor-12v':                      '/images/products/nema-17-stepper-motor.svg',
    '096-inch-oled-display':                  '/images/products/oled-096-display.svg',
}
DEFAULT_IMAGE = '/images/products/arduino-nano-every.svg'


def seed_categories_and_brands(apps, schema_editor):
    Category = apps.get_model('products', 'Category')
    Brand    = apps.get_model('products', 'Brand')

    for data in CATEGORY_SEED:
        cat_id = data.pop('id')
        Category.objects.get_or_create(id=cat_id, defaults=data)
        data['id'] = cat_id

    for data in BRAND_SEED:
        brand_id = data.pop('id')
        Brand.objects.get_or_create(id=brand_id, defaults=data)
        data['id'] = brand_id


def reverse_seed(apps, schema_editor):
    pass  # Leave data in place on reverse


def seed_product_images(apps, schema_editor):
    Product      = apps.get_model('products', 'Product')
    ProductImage = apps.get_model('products', 'ProductImage')

    for product in Product.objects.filter(is_active=True):
        if ProductImage.objects.filter(product=product).exists():
            continue
        image_path = SLUG_IMAGE_MAP.get(product.slug or '') or SLUG_IMAGE_MAP.get(product.external_id or '') or DEFAULT_IMAGE
        ProductImage.objects.create(
            product    = product,
            image      = image_path,
            alt_text   = product.name,
            is_primary = True,
            sort_order = 0,
        )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('products', '0004_reconcile_legacy_product_fields'),
    ]

    operations = [

        # ── 1. Add enrichment columns to existing 'categories' table ──────────
        # Use SeparateDatabaseAndState: DB gets ADD COLUMN; state gets CreateModel.
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=[
                        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_name varchar(50) NOT NULL DEFAULT '';",
                        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;",
                        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS featured_color varchar(30) NOT NULL DEFAULT '';",
                        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES categories(id) ON DELETE SET NULL;",
                        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url varchar(500) NOT NULL DEFAULT '';",
                    ],
                    reverse_sql=[
                        "ALTER TABLE categories DROP COLUMN IF EXISTS icon_name;",
                        "ALTER TABLE categories DROP COLUMN IF EXISTS sort_order;",
                        "ALTER TABLE categories DROP COLUMN IF EXISTS featured_color;",
                        "ALTER TABLE categories DROP COLUMN IF EXISTS parent_id;",
                        "ALTER TABLE categories DROP COLUMN IF EXISTS image_url;",
                    ],
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='Category',
                    fields=[
                        ('id',            models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                        ('name',          models.CharField(max_length=100)),
                        ('slug',          models.SlugField(max_length=120, unique=True)),
                        ('description',   models.TextField(blank=True)),
                        ('image_url',     models.CharField(blank=True, max_length=500)),
                        ('icon_name',     models.CharField(blank=True, max_length=50)),
                        ('sort_order',    models.PositiveIntegerField(default=0)),
                        ('is_active',     models.BooleanField(default=True)),
                        ('featured_color', models.CharField(blank=True, max_length=30)),
                        ('created_at',    models.DateTimeField(auto_now_add=True)),
                        ('updated_at',    models.DateTimeField(auto_now=True)),
                        ('parent',        models.ForeignKey(blank=True, null=True,
                                          on_delete=django.db.models.deletion.SET_NULL,
                                          related_name='children', to='products.category')),
                    ],
                    options={'db_table': 'categories', 'ordering': ['sort_order', 'name'],
                             'verbose_name_plural': 'Categories'},
                ),
            ],
        ),

        # ── 2. Add enrichment columns to existing 'brands' table ──────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=[
                        "ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;",
                        "ALTER TABLE brands ADD COLUMN IF NOT EXISTS country varchar(100) NOT NULL DEFAULT '';",
                        "ALTER TABLE brands ADD COLUMN IF NOT EXISTS cover_url varchar(500) NOT NULL DEFAULT '';",
                        "ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url varchar(500) NOT NULL DEFAULT '';",
                    ],
                    reverse_sql=[
                        "ALTER TABLE brands DROP COLUMN IF EXISTS is_featured;",
                        "ALTER TABLE brands DROP COLUMN IF EXISTS country;",
                        "ALTER TABLE brands DROP COLUMN IF EXISTS cover_url;",
                        "ALTER TABLE brands DROP COLUMN IF EXISTS logo_url;",
                    ],
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='Brand',
                    fields=[
                        ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                        ('name',        models.CharField(max_length=100)),
                        ('slug',        models.SlugField(max_length=120, unique=True)),
                        ('logo_url',    models.CharField(blank=True, max_length=500)),
                        ('cover_url',   models.CharField(blank=True, max_length=500)),
                        ('description', models.TextField(blank=True)),
                        ('website',     models.URLField(blank=True)),
                        ('is_featured', models.BooleanField(default=False)),
                        ('is_active',   models.BooleanField(default=True)),
                        ('country',     models.CharField(blank=True, max_length=100)),
                        ('created_at',  models.DateTimeField(auto_now_add=True)),
                        ('updated_at',  models.DateTimeField(auto_now=True)),
                    ],
                    options={'db_table': 'brands', 'ordering': ['name']},
                ),
            ],
        ),

        # ── 3. Seed categories and brands ────────────────────────────────────
        migrations.RunPython(seed_categories_and_brands, reverse_code=reverse_seed),

        # ── 4. Convert Product.category_id / brand_id state from
        #       IntegerField → ForeignKey (DB already has correct FK constraints)
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # DB is already correct — no changes needed
            state_operations=[
                migrations.RemoveField(model_name='product', name='category_id'),
                migrations.RemoveField(model_name='product', name='brand_id'),
                migrations.AddField(
                    model_name='product',
                    name='category',
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='products',
                        to='products.category',
                    ),
                ),
                migrations.AddField(
                    model_name='product',
                    name='brand',
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='products',
                        to='products.brand',
                    ),
                ),
            ],
        ),

        # ── 5. Declare ORM state for ProductImage (table already exists) ──────
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # product_images table already exists
            state_operations=[
                migrations.CreateModel(
                    name='ProductImage',
                    fields=[
                        ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                        ('image',      models.CharField(max_length=500)),
                        ('alt_text',   models.CharField(blank=True, max_length=200)),
                        ('is_primary', models.BooleanField(default=False)),
                        ('sort_order', models.PositiveIntegerField(default=0)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('product',    models.ForeignKey(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='images', to='products.product',
                        )),
                    ],
                    options={'db_table': 'product_images', 'ordering': ['sort_order', 'id']},
                ),
            ],
        ),

        # ── 6. Declare ORM state for ProductReview (table = 'reviews') ────────
        #       DB column 'comment' is exposed in model as 'body' (db_column='comment').
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # reviews table already exists
            state_operations=[
                migrations.CreateModel(
                    name='ProductReview',
                    fields=[
                        ('id',                   models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                        ('rating',               models.PositiveSmallIntegerField()),
                        ('title',                models.CharField(blank=True, max_length=200)),
                        ('body',                 models.TextField(blank=True, db_column='comment')),
                        ('is_verified_purchase', models.BooleanField(default=False)),
                        ('is_approved',          models.BooleanField(default=True)),
                        ('created_at',           models.DateTimeField(auto_now_add=True)),
                        ('updated_at',           models.DateTimeField(auto_now=True)),
                        ('product', models.ForeignKey(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='reviews', to='products.product',
                        )),
                        ('user', models.ForeignKey(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='product_reviews',
                            to=settings.AUTH_USER_MODEL,
                        )),
                    ],
                    options={
                        'db_table': 'reviews',
                        'ordering': ['-created_at'],
                        'unique_together': {('product', 'user')},
                    },
                ),
            ],
        ),

        # ── 7. Seed one ProductImage per product that has none ────────────────
        migrations.RunPython(seed_product_images, reverse_code=reverse_seed),
    ]
