from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
import random

from products.models import Category, Product, ProductVariant, ProductAttribute, AttributeValue


class Command(BaseCommand):
    help = 'Seed sample categories, attributes, products and variants for development'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Starting seeding sample products...')

        # Create Attributes and Values (idempotent - reuse by translation name)
        self.stdout.write('Creating attributes and values...')

        def get_or_create_attribute(name):
            attr = ProductAttribute.objects.filter(translations__name__iexact=name).first()
            if attr:
                return attr
            attr = ProductAttribute.objects.create()
            attr.set_current_language('pl')
            attr.name = name
            attr.save()
            return attr

        def get_or_create_value(attribute, value_name):
            val = AttributeValue.objects.filter(attribute=attribute, translations__value__iexact=value_name).first()
            if val:
                return val
            val = AttributeValue.objects.create(attribute=attribute)
            val.set_current_language('pl')
            val.value = value_name
            val.save()
            return val

        color_attr = get_or_create_attribute('Kolor')
        red = get_or_create_value(color_attr, 'Czerwony')
        green = get_or_create_value(color_attr, 'Zielony')
        blue = get_or_create_value(color_attr, 'Niebieski')

        material_attr = get_or_create_attribute('Materiał')
        oak = get_or_create_value(material_attr, 'Dąb')
        pine = get_or_create_value(material_attr, 'Sosna')

        size_attr = get_or_create_attribute('Rozmiar')
        small = get_or_create_value(size_attr, 'Mały')
        medium = get_or_create_value(size_attr, 'Średni')
        large = get_or_create_value(size_attr, 'Duży')

        # Create Categories
        self.stdout.write('Creating categories...')
        categories = []
        cat_defs = [
            ('Balia Ogrodowa', 'balie-ogrodowe'),
            ('Balia Drewniana', 'balie-drewniane'),
            ('Sauny', 'sauny'),
            ('Akcesoria', 'akcesoria')
        ]
        for name, slug in cat_defs:
            cat = Category.objects.filter(translations__slug__iexact=slug).first()
            if not cat:
                cat = Category.objects.create()
            cat.set_current_language('pl')
            cat.name = name
            cat.slug = slug
            cat.save()
            categories.append(cat)

        # Create Products and Variants
        self.stdout.write('Creating products and variants...')
        created_products = 0
        created_variants = 0

        sample_titles = [
            'Balia Premium', 'Balia Classic', 'Sauna Borea', 'Sauna Vita',
            'Filtr Wody', 'Pokrywa', 'Stolik Ogrodowy', 'Krzesło Drewniane'
        ]

        # Shuffle to distribute across categories
        random.shuffle(sample_titles)

        for i, title in enumerate(sample_titles):
            cat = categories[i % len(categories)]
            # Create product
            prod = Product.objects.create(category=cat, available=True)
            prod.set_current_language('pl')
            prod.name = title
            prod.slug = f"{title.lower().replace(' ', '-')}-{i}"
            prod.description = f"Opis produktu {title}"
            prod.save()
            created_products += 1

            # Create 2-3 variants per product with random attributes
            variants_count = random.choice([2, 3])
            for v in range(variants_count):
                sku = f"{prod.slug}-V{v}"
                price = Decimal(random.randrange(500, 5000)) / Decimal(100)  # 5.00 - 50.00
                stock = random.randint(0, 50)
                variant = ProductVariant.objects.create(
                    product=prod,
                    sku=sku,
                    price=price,
                    stock=stock,
                    low_stock_threshold=5,
                    available=True
                )
                variant.set_current_language('pl')
                variant.name = f"Wariant {v+1}"
                variant.save()

                # Choose random attribute values
                chosen_color = random.choice([red, green, blue])
                chosen_material = random.choice([oak, pine])
                chosen_size = random.choice([small, medium, large])

                variant.attributes.add(chosen_color)
                variant.attributes.add(chosen_material)
                variant.attributes.add(chosen_size)

                created_variants += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created_products} products and {created_variants} variants'))
