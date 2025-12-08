"""
Management command to reset products with proper variant structure.
Usage: python manage.py reset_products
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from products.models import (
    Product, ProductVariant, ProductAttribute, AttributeValue,
    Category, ProductImage
)


class Command(BaseCommand):
    help = 'Reset products with proper SKU variants and attributes'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting product reset...'))

        with transaction.atomic():
            # 1. Delete all existing products and variants
            self.stdout.write('Deleting existing products...')
            ProductImage.objects.all().delete()
            ProductVariant.objects.all().delete()
            Product.objects.all().delete()
            
            # Keep attributes and categories
            self.stdout.write(self.style.SUCCESS('✓ Cleared products and variants'))

            # 2. Get or create attributes
            self.stdout.write('Setting up attributes...')
            
            # Helper function to get or create attribute value
            def get_or_create_attr_value(attr, value_name):
                # Try to find existing value by name
                for val in attr.values.all():
                    val.set_current_language('pl')
                    if val.value == value_name:
                        return val
                # Create new if not found
                new_val = AttributeValue.objects.create(attribute=attr)
                new_val.set_current_language('pl')
                new_val.value = value_name
                new_val.save()
                return new_val
            
            # Size attribute
            size_attr = ProductAttribute.objects.filter(translations__name='Rozmiar').first()
            if not size_attr:
                size_attr = ProductAttribute.objects.create()
                size_attr.set_current_language('pl')
                size_attr.name = 'Rozmiar'
                size_attr.save()
            
            size_small = get_or_create_attr_value(size_attr, 'Mały')
            size_medium = get_or_create_attr_value(size_attr, 'Średni')
            size_large = get_or_create_attr_value(size_attr, 'Duży')

            # Material attribute
            material_attr = ProductAttribute.objects.filter(translations__name='Materiał').first()
            if not material_attr:
                material_attr = ProductAttribute.objects.create()
                material_attr.set_current_language('pl')
                material_attr.name = 'Materiał'
                material_attr.save()
            
            material_oak = get_or_create_attr_value(material_attr, 'Dąb')
            material_larch = get_or_create_attr_value(material_attr, 'Modrzew')
            material_acacia = get_or_create_attr_value(material_attr, 'Akacja')

            # Heating attribute
            heating_attr = ProductAttribute.objects.filter(translations__name='Ogrzewanie').first()
            if not heating_attr:
                heating_attr = ProductAttribute.objects.create()
                heating_attr.set_current_language('pl')
                heating_attr.name = 'Ogrzewanie'
                heating_attr.save()
            
            heating_wood = get_or_create_attr_value(heating_attr, 'Piec na drewno')
            heating_electric = get_or_create_attr_value(heating_attr, 'Grzałka elektryczna')
            heating_none = get_or_create_attr_value(heating_attr, 'Brak')

            self.stdout.write(self.style.SUCCESS('✓ Attributes ready'))

            # 3. Get categories
            try:
                category_balie = Category.objects.get(translations__slug='balie-ogrodowe')
            except Category.DoesNotExist:
                self.stdout.write(self.style.ERROR('Category "balie-ogrodowe" not found!'))
                return

            # 4. Create sample products with variants
            self.stdout.write('Creating products with variants...')

            # Product 1: Balia Ogrodowa Premium
            product1 = Product.objects.create(
                category=category_balie,
                available=True,
                attributes_config={}  # Empty - not used anymore
            )
            product1.set_current_language('pl')
            product1.name = 'Balia Ogrodowa Premium'
            product1.slug = 'balia-ogrodowa-premium'
            product1.description = 'Ekskluzywna balia ogrodowa wykonana z najwyższej jakości drewna. Idealna do relaksu w ogrodzie.'
            product1.save()

            # Variants for Product 1
            variant1_1 = ProductVariant.objects.create(
                product=product1,
                sku='BALIA-PREM-SMALL-OAK',
                price='3999.00',
                stock=10,
                low_stock_threshold=3,
                available=True
            )
            variant1_1.set_current_language('pl')
            variant1_1.name = 'Mała - Dąb'
            variant1_1.save()
            variant1_1.attributes.add(size_small, material_oak, heating_wood)

            variant1_2 = ProductVariant.objects.create(
                product=product1,
                sku='BALIA-PREM-MEDIUM-OAK',
                price='4999.00',
                stock=8,
                low_stock_threshold=3,
                available=True
            )
            variant1_2.set_current_language('pl')
            variant1_2.name = 'Średnia - Dąb'
            variant1_2.save()
            variant1_2.attributes.add(size_medium, material_oak, heating_electric)

            variant1_3 = ProductVariant.objects.create(
                product=product1,
                sku='BALIA-PREM-LARGE-LARCH',
                price='5999.00',
                stock=5,
                low_stock_threshold=2,
                available=True
            )
            variant1_3.set_current_language('pl')
            variant1_3.name = 'Duża - Modrzew'
            variant1_3.save()
            variant1_3.attributes.add(size_large, material_larch, heating_wood)

            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {product1.name} with 3 variants'))

            # Product 2: Balia Drewniana Classic
            product2 = Product.objects.create(
                category=category_balie,
                available=True,
                attributes_config={}
            )
            product2.set_current_language('pl')
            product2.name = 'Balia Drewniana Classic'
            product2.slug = 'balia-drewniana-classic'
            product2.description = 'Klasyczna balia drewniana w przystępnej cenie. Sprawdzi się w każdym ogrodzie.'
            product2.save()

            # Variants for Product 2
            variant2_1 = ProductVariant.objects.create(
                product=product2,
                sku='BALIA-CLAS-SMALL-ACACIA',
                price='2999.00',
                stock=15,
                low_stock_threshold=5,
                available=True
            )
            variant2_1.set_current_language('pl')
            variant2_1.name = 'Mała - Akacja'
            variant2_1.save()
            variant2_1.attributes.add(size_small, material_acacia, heating_none)

            variant2_2 = ProductVariant.objects.create(
                product=product2,
                sku='BALIA-CLAS-MEDIUM-LARCH',
                price='3499.00',
                stock=12,
                low_stock_threshold=5,
                available=True
            )
            variant2_2.set_current_language('pl')
            variant2_2.name = 'Średnia - Modrzew'
            variant2_2.save()
            variant2_2.attributes.add(size_medium, material_larch, heating_wood)

            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {product2.name} with 2 variants'))

            # Product 3: Balia Spa Deluxe
            product3 = Product.objects.create(
                category=category_balie,
                available=True,
                attributes_config={}
            )
            product3.set_current_language('pl')
            product3.name = 'Balia Spa Deluxe'
            product3.slug = 'balia-spa-deluxe'
            product3.description = 'Luksusowa balia spa z systemem grzewczym. Najwyższa jakość wykonania.'
            product3.save()

            # Variants for Product 3
            variant3_1 = ProductVariant.objects.create(
                product=product3,
                sku='BALIA-SPA-MEDIUM-OAK-ELEC',
                price='6999.00',
                stock=6,
                low_stock_threshold=2,
                available=True
            )
            variant3_1.set_current_language('pl')
            variant3_1.name = 'Średnia - Dąb - Elektryczna'
            variant3_1.save()
            variant3_1.attributes.add(size_medium, material_oak, heating_electric)

            variant3_2 = ProductVariant.objects.create(
                product=product3,
                sku='BALIA-SPA-LARGE-OAK-ELEC',
                price='8999.00',
                stock=4,
                low_stock_threshold=2,
                available=True
            )
            variant3_2.set_current_language('pl')
            variant3_2.name = 'Duża - Dąb - Elektryczna'
            variant3_2.save()
            variant3_2.attributes.add(size_large, material_oak, heating_electric)

            variant3_3 = ProductVariant.objects.create(
                product=product3,
                sku='BALIA-SPA-LARGE-LARCH-WOOD',
                price='7999.00',
                stock=3,
                low_stock_threshold=1,
                available=True
            )
            variant3_3.set_current_language('pl')
            variant3_3.name = 'Duża - Modrzew - Piec'
            variant3_3.save()
            variant3_3.attributes.add(size_large, material_larch, heating_wood)

            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {product3.name} with 3 variants'))

            # Product 4: Balia Ogrodowa Basic
            product4 = Product.objects.create(
                category=category_balie,
                available=True,
                attributes_config={}
            )
            product4.set_current_language('pl')
            product4.name = 'Balia Ogrodowa Basic'
            product4.slug = 'balia-ogrodowa-basic'
            product4.description = 'Podstawowa balia ogrodowa dla osób ceniących prostotę i funkcjonalność.'
            product4.save()

            # Variants for Product 4
            variant4_1 = ProductVariant.objects.create(
                product=product4,
                sku='BALIA-BASIC-SMALL',
                price='2499.00',
                stock=20,
                low_stock_threshold=8,
                available=True
            )
            variant4_1.set_current_language('pl')
            variant4_1.name = 'Mała'
            variant4_1.save()
            variant4_1.attributes.add(size_small, heating_none)

            variant4_2 = ProductVariant.objects.create(
                product=product4,
                sku='BALIA-BASIC-MEDIUM',
                price='2999.00',
                stock=18,
                low_stock_threshold=8,
                available=True
            )
            variant4_2.set_current_language('pl')
            variant4_2.name = 'Średnia'
            variant4_2.save()
            variant4_2.attributes.add(size_medium, heating_none)

            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {product4.name} with 2 variants'))

            # Summary
            total_products = Product.objects.count()
            total_variants = ProductVariant.objects.count()
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS('✓ Product reset completed successfully!'))
            self.stdout.write(self.style.SUCCESS(f'  Total products: {total_products}'))
            self.stdout.write(self.style.SUCCESS(f'  Total variants: {total_variants}'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write('')
            self.stdout.write('Products created:')
            for product in Product.objects.all():
                variant_count = product.variants.count()
                self.stdout.write(f'  • {product.name} ({variant_count} variants)')
