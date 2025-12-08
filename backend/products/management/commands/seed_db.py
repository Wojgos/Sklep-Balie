# backend/products/management/commands/seed_db.py
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from django.contrib.sites.models import Site
from django.conf import settings
from django.utils import translation
from django.utils.text import slugify  # <--- KLUCZOWY IMPORT
from promotions.models import LoyaltyReward

from products.models import (
    Category,
    ProductAttribute,
    AttributeValue,
    Product,
    ProductVariant,
    ProductImage
)
from orders.models import Order, OrderItem
from users.models import CustomUser
from allauth.account.models import EmailAddress

User = CustomUser


class Command(BaseCommand):
    help = 'Wypełnia bazę danych danymi testowymi (PL i EN)'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.faker_pl = Faker('pl_PL')
        self.faker_en = Faker('en_US')

    def add_arguments(self, parser):
        parser.add_argument(
            '--amount',
            type=int,
            help='Ilość produktów (matek) do stworzenia',
            default=20
        )

    @transaction.atomic
    def handle(self, *args, **options):
        amount = options['amount']

        # 1. Konfiguracja domeny
        try:
            site = Site.objects.get(id=settings.SITE_ID)
            site.domain = 'localhost:4200'
            site.name = 'Balie Ogrodowe Sklep'
            site.save()
            self.stdout.write(self.style.SUCCESS(f'  Domena ustawiona na: {site.domain}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  Nie udało się ustawić domeny: {e}'))

        # 2. Czyszczenie danych
        self.stdout.write(self.style.WARNING(
            'Rozpoczynanie czyszczenia starych danych (Użytkownicy ZOSTANĄ)...'
        ))
        self._clear_data()

        self.stdout.write(self.style.NOTICE('Tworzenie nowych danych...'))

        # 3. Użytkownicy
        users = self._get_or_create_users()
        if not users:
            self.stdout.write(self.style.ERROR("Błąd użytkowników."))
            return

        # 4. Atrybuty (PL + EN)
        attributes = self._create_attributes_and_values()

        # 5. Kategorie (PL + EN)
        categories = self._create_categories()

        # 6. Produkty (PL + EN)
        products = self._create_products(categories, amount)

        # 7. Warianty (PL + EN)
        variants = self._create_variants(products, attributes)

        # 8. Zamówienia
        self._create_orders(users['anna_nowak'], variants)

        # 9. Nagrody
        self._create_loyalty_rewards()

        self.stdout.write(self.style.SUCCESS(
            f'Baza danych została pomyślnie wypełniona {amount} produktami (w 2 językach)!'
        ))

    def _clear_data(self):
        """Usuwa dane transakcyjne i produktowe."""
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        ProductImage.objects.all().delete()
        ProductVariant.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        AttributeValue.objects.all().delete()
        ProductAttribute.objects.all().delete()
        LoyaltyReward.objects.all().delete()

    def _get_or_create_users(self):
        # Admin
        admin_user, created = User.objects.get_or_create(
            username='rafal',
            defaults={
                'email': 'rafal123@gmail.com',
                'first_name': 'Rafał', 'last_name': 'Rafał',
                'is_staff': True, 'is_superuser': True, 'is_active': True
            }
        )
        if created:
            admin_user.set_password('BardzoSilneHaslo123!')
            admin_user.save()
            EmailAddress.objects.create(user=admin_user, email=admin_user.email, primary=True, verified=True)

        # Klient Anna
        tester, created = User.objects.get_or_create(
            username='anna_nowak',
            defaults={
                'email': 'nowy_uzytkownik@przyklad.pl',
                'first_name': 'Anna', 'last_name': 'Nowak',
                'is_active': True, 'loyalty_points': 10000
            }
        )
        if created:
            tester.set_password('BardzoSilneHaslo123!')
            tester.save()
            EmailAddress.objects.create(user=tester, email=tester.email, primary=True, verified=True)
        else:
            tester.loyalty_points = 10000
            tester.save()

        return {'admin': admin_user, 'anna_nowak': tester}

    def _create_categories(self):
        self.stdout.write('  Tworzenie kategorii (i18n)...')

        # Helper do tworzenia kategorii (BEZ parenta)
        def make_cat(name_pl, name_en):  # Usunięto parent=None
            # Tworzymy kategorię bez żadnych argumentów
            cat = Category.objects.create()

            cat.set_current_language('pl')
            cat.name = name_pl
            cat.slug = slugify(name_pl)
            cat.save()

            cat.set_current_language('en')
            cat.name = name_en
            cat.slug = slugify(name_en)
            cat.save()
            return cat

        balie = make_cat('Balie Ogrodowe', 'Garden Hot Tubs')
        jacuzzi = make_cat('Jacuzzi Ogrodowe', 'Garden Jacuzzis')
        drewniane = make_cat('Balie Drewniane', 'Wooden Hot Tubs')
        akcesoria = make_cat('Akcesoria', 'Accessories')
        # Pokrywy teraz są samodzielną kategorią, nie dzieckiem
        pokrywy = make_cat('Pokrywy Termiczne', 'Thermal Covers')

        return {
            'jacuzzi': jacuzzi, 'drewniane': drewniane,
            'akcesoria': akcesoria, 'pokrywy': pokrywy
        }

    def _create_attributes_and_values(self):
        self.stdout.write('  Tworzenie atrybutów (i18n)...')

        def make_attr(name_pl, name_en):
            attr = ProductAttribute.objects.create()
            attr.set_current_language('pl');
            attr.name = name_pl;
            attr.save()
            attr.set_current_language('en');
            attr.name = name_en;
            attr.save()
            return attr

        def make_val(attr, val_pl, val_en):
            val = AttributeValue.objects.create(attribute=attr)
            val.set_current_language('pl')
            val.value = val_pl
            val.save()
            val.set_current_language('en')
            val.value = val_en
            val.save()
            return val

        piec = make_attr('Typ pieca', 'Heater Type')
        p_drewno = make_val(piec, 'Na drewno', 'Wood-fired')
        p_elektr = make_val(piec, 'Elektryczny', 'Electric')

        kolor = make_attr('Kolor', 'Color')
        k_bialy = make_val(kolor, 'Biały', 'White')
        k_szary = make_val(kolor, 'Szary', 'Grey')

        return {
            'piece': [p_drewno, p_elektr],
            'kolory': [k_bialy, k_szary]
        }

    def _create_products(self, categories, amount):
        self.stdout.write(f'  Tworzenie {amount} produktów...')
        products_list = []
        cats = list(categories.values())

        # GŁÓWNA PĘTLA PRODUKTÓW
        for i in range(amount):
            cat = random.choice(cats)
            product = Product.objects.create(category=cat, available=True)

            # PL
            product.set_current_language('pl')
            name_pl = f"Balia Model {self.faker_pl.word().capitalize()} {i}"
            product.name = name_pl
            product.slug = slugify(name_pl)  # Jawny slug
            product.description = self.faker_pl.paragraph()
            product.save()

            # EN
            product.set_current_language('en')
            name_en = f"Hot Tub Model {self.faker_en.word().capitalize()} {i}"
            product.name = name_en
            product.slug = slugify(name_en)  # Jawny slug
            product.description = self.faker_en.paragraph()
            product.save()

            products_list.append(product)

        # DODATKOWE AKCESORIA
        self.stdout.write('  Tworzenie dodatkowych 10 akcesoriów...')
        for i in range(10):
            is_cover = random.choice([True, False])
            category = categories['pokrywy'] if is_cover else categories['akcesoria']

            product = Product.objects.create(category=category, available=True)

            # PL
            product.set_current_language('pl')
            base_name_pl = 'Pokrywa Termiczna' if is_cover else 'Akcesorium'
            name_pl = f'{base_name_pl} {self.faker_pl.word().capitalize()} {i + 1}'
            product.name = name_pl
            product.slug = slugify(name_pl)  # Jawny slug
            product.description = self.faker_pl.paragraph(nb_sentences=5)
            product.save()

            # EN
            product.set_current_language('en')
            base_name_en = 'Thermal Cover' if is_cover else 'Accessory'
            name_en = f'{base_name_en} {self.faker_en.word().capitalize()} {i + 1}'
            product.name = name_en
            product.slug = slugify(name_en)  # Jawny slug
            product.description = self.faker_en.paragraph(nb_sentences=5)
            product.save()

            products_list.append(product)

        return products_list

    def _create_variants(self, products, attributes):
        self.stdout.write('  Tworzenie wariantów...')
        variants_list = []

        for product in products:
            for i in range(random.randint(1, 3)):
                piec = random.choice(attributes['piece'])
                kolor = random.choice(attributes['kolory'])

                price = Decimal(random.uniform(10000, 20000))
                sku = f"SKU-{product.id}-{i}"

                variant = ProductVariant.objects.create(
                    product=product, sku=sku, price=price, stock=5
                )
                variant.attributes.add(piec, kolor)

                # PL
                variant.set_current_language('pl')
                variant.name = "Standard"
                variant.save()

                # EN
                variant.set_current_language('en')
                variant.name = "Standard"
                variant.save()

                # Zdjęcie
                img = ProductImage.objects.create(
                    product=product, variant=variant,
                    image="product_images/placeholder.jpg", is_main=True
                )
                img.set_current_language('pl')
                img.alt_text = "Zdjęcie"
                img.save()
                img.set_current_language('en')
                img.alt_text = "Image"
                img.save()

                variants_list.append(variant)
        return variants_list

    def _create_orders(self, user, variants):
        if not variants: return

        # Tworzymy zamówienia (bez zmian w logice, bo Order nie jest tłumaczony)
        for _ in range(5):
            order = Order.objects.create(
                user=user,
                first_name=user.first_name, last_name=user.last_name,
                email=user.email, address="Ulica 1", postal_code="00-000", city="Miasto",
                total_price=0
            )
            item = OrderItem.objects.create(
                order=order, variant=variants[0],
                product_name="Produkt", price=variants[0].price, quantity=1
            )
            order.total_price = item.price
            order.save()

    def _create_loyalty_rewards(self):
        self.stdout.write('  Tworzenie nagród lojalnościowych (i18n)...')
        if LoyaltyReward.objects.exists():
            return

        def create_reward(points, value, is_percent, desc_pl, desc_en):
            reward = LoyaltyReward.objects.create(
                points_required=points,
                reward_value=value,
                is_percentage=is_percent,
                active=True
            )
            reward.set_current_language('pl')
            reward.description = desc_pl
            reward.save()
            reward.set_current_language('en')
            reward.description = desc_en
            reward.save()

        create_reward(500, 20.00, False, "Rabat 20 PLN", "Discount 20 PLN")
        create_reward(1000, 50.00, False, "Super Rabat 50 PLN", "Super Discount 50 PLN")
        create_reward(5000, 15.00, True, "Złoty status: -15%", "Gold Status: -15%")
