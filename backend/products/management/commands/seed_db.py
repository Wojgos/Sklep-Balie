# backend/products/management/commands/seed_db.py
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.files.base import ContentFile
from django.contrib.sites.models import Site
from django.conf import settings
from django.utils import translation
from django.utils.text import slugify

from faker import Faker

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
from promotions.models import LoyaltyReward

User = CustomUser


class Command(BaseCommand):
    help = 'Wypełnia bazę danych danymi testowymi (PL i EN) wraz ze zdjęciami i cenami'

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

    def _generate_dummy_image(self, text):
        """Generuje prosty obrazek z tekstem w pamięci (nie wymaga plików na dysku)."""
        color = (random.randint(50, 200), random.randint(50, 200), random.randint(50, 200))
        img = Image.new('RGB', (800, 600), color=color)
        d = ImageDraw.Draw(img)
        # Rysujemy tekst na środku (uproszczone pozycjonowanie)
        d.text((50, 280), text, fill=(255, 255, 255))

        blob = BytesIO()
        img.save(blob, 'JPEG')
        return ContentFile(blob.getvalue(), name=f'{slugify(text)}.jpg')

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
        self.stdout.write(self.style.WARNING('Rozpoczynanie czyszczenia starych danych...'))
        self._clear_data()

        self.stdout.write(self.style.NOTICE('Tworzenie nowych danych...'))

        # 3. Użytkownicy
        users = self._get_or_create_users()

        # 4. Atrybuty
        attributes = self._create_attributes_and_values()

        # 5. Kategorie
        categories = self._create_categories()

        # 6. Produkty (Matki)
        products = self._create_products(categories, amount)

        # 7. Warianty (To tutaj są ceny i zdjęcia!)
        variants = self._create_variants(products, attributes)

        # 8. Zamówienia
        self._create_orders(users['anna_nowak'], variants)

        # 9. Nagrody
        self._create_loyalty_rewards()

        self.stdout.write(self.style.SUCCESS(
            f'✅ Baza danych gotowa! Utworzono {amount} produktów w 2 językach ze zdjęciami i cenami.'
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
        self.stdout.write('  Tworzenie użytkowników...')
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
                'is_active': True
            }
        )
        # Zawsze ustawiamy punkty, nawet jak user istniał
        tester.loyalty_points = 10000
        if created:
            tester.set_password('BardzoSilneHaslo123!')
            EmailAddress.objects.create(user=tester, email=tester.email, primary=True, verified=True)
        tester.save()

        return {'admin': admin_user, 'anna_nowak': tester}

    def _create_categories(self):
        self.stdout.write('  Tworzenie kategorii (i18n)...')


        # Helper do tworzenia kategorii (BEZ parenta)
        def make_cat(name_pl, name_en):  # Usunięto parent=None
            # Tworzymy kategorię bez żadnych argumentów
>>>>>>> af11c8844559522613158326f9c5ec6e9c4d1f83
            cat = Category.objects.create()

            cat.set_current_language('pl')
            cat.name = name_pl
            cat.slug = slugify(name_pl)
            # Generujemy zdjęcie kategorii
            cat.image = self._generate_dummy_image(name_pl)
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
<<<<<<< HEAD
=======
        # Pokrywy teraz są samodzielną kategorią, nie dzieckiem
>>>>>>> af11c8844559522613158326f9c5ec6e9c4d1f83
        pokrywy = make_cat('Pokrywy Termiczne', 'Thermal Covers')

        return {
            'balie': make_cat('Balie Ogrodowe', 'Garden Hot Tubs'),
            'jacuzzi': make_cat('Jacuzzi Ogrodowe', 'Garden Jacuzzis'),
            'akcesoria': make_cat('Akcesoria', 'Accessories'),
            'pokrywy': make_cat('Pokrywy Termiczne', 'Thermal Covers')
        }

    def _create_attributes_and_values(self):
        self.stdout.write('  Tworzenie atrybutów...')

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
            val.set_current_language('pl');
            val.value = val_pl;
            val.save()
            val.set_current_language('en');
            val.value = val_en;
            val.save()
            return val

        piec = make_attr('Typ pieca', 'Heater Type')
        p_drewno = make_val(piec, 'Na drewno', 'Wood-fired')
        p_elektr = make_val(piec, 'Elektryczny', 'Electric')

        kolor = make_attr('Kolor wkładu', 'Insert Color')
        k_bialy = make_val(kolor, 'Biały', 'White')
        k_szary = make_val(kolor, 'Szary', 'Grey')

        return {'piece': [p_drewno, p_elektr], 'kolory': [k_bialy, k_szary]}

    def _create_products(self, categories, amount):
        self.stdout.write(f'  Tworzenie {amount} produktów...')
        products_list = []
        cats = list(categories.values())

        for i in range(amount):
            cat = random.choice(cats)
            product = Product.objects.create(category=cat, available=True)

            # PL
            product.set_current_language('pl')
            name_pl = f"Balia Model {self.faker_pl.word().capitalize()} {i}"
            product.name = name_pl
            product.slug = slugify(name_pl)
            product.description = self.faker_pl.paragraph()
            product.save()

            # EN
            product.set_current_language('en')
            name_en = f"Hot Tub Model {self.faker_en.word().capitalize()} {i}"
            product.name = name_en
            product.slug = slugify(name_en)
            product.description = self.faker_en.paragraph()
            product.save()

            products_list.append(product)
        return products_list

    def _create_variants(self, products, attributes):
        self.stdout.write('  Tworzenie wariantów, cen i zdjęć...')
        variants_list = []

        for product in products:
            # Tworzymy 1-3 warianty dla każdego produktu
            for i in range(random.randint(1, 3)):

                # 1. Losowanie cech
                piec = random.choice(attributes['piece'])
                kolor = random.choice(attributes['kolory'])

                # 2. Obliczanie Ceny (Dynamiczne)
                base_price = Decimal("10000.00")
                if "lektrycz" in piec.safe_translation_getter('value', language_code='pl'):
                    base_price += Decimal("2500.00")
                if "Biały" in kolor.safe_translation_getter('value', language_code='pl'):
                    base_price += Decimal("500.00")

                # Dodajemy losową końcówkę, żeby nie było nudno
                final_price = base_price + Decimal(random.randint(0, 99))

                sku = f"SKU-{product.id}-{i}"

                # 3. Tworzenie Wariantu (Z CENĄ I STOCKIEM!)
                variant = ProductVariant.objects.create(
                    product=product,
                    sku=sku,
                    price=final_price,  # <--- TO JEST KLUCZOWE
                    stock=random.randint(2, 20),  # <--- TO TEŻ
                    available=True
                )
                variant.attributes.add(piec, kolor)

                # Tłumaczenie nazwy wariantu
                variant.set_current_language('pl')
                variant.name = f"Wariant {i + 1}"
                variant.save()

                variant.set_current_language('en')
                variant.name = f"Variant {i + 1}"
                variant.save()

                # 4. Generowanie Zdjęcia (Pillow)
                # Używamy nazwy produktu, żeby na zdjęciu był napis
                product_name = product.safe_translation_getter('name', language_code='pl')
                img_file = self._generate_dummy_image(f"{product_name}\n{sku}")

                img = ProductImage.objects.create(
                    product=product,
                    variant=variant,
                    image=img_file,
                    is_main=True
                )

                # Tłumaczenie Alt Text zdjęcia
                img.set_current_language('pl');
                img.alt_text = "Zdjęcie produktu";
                img.save()
                img.set_current_language('en');
                img.alt_text = "Product Image";
                img.save()

                variants_list.append(variant)
        return variants_list

    def _create_orders(self, user, variants):
        if not variants: return
        for _ in range(3):
            order = Order.objects.create(
                user=user,
                first_name=user.first_name, last_name=user.last_name,
                email=user.email, address="Ulica Testowa 1", postal_code="00-000", city="Warszawa",
                total_price=0
            )
            # Dodajemy losowy wariant do zamówienia
            v = random.choice(variants)
            item = OrderItem.objects.create(
                order=order, variant=v,
                product_name="Produkt Testowy", price=v.price, quantity=1
            )
            order.total_price = item.price
            order.save()

    def _create_loyalty_rewards(self):
        self.stdout.write('  Tworzenie nagród lojalnościowych...')
        if LoyaltyReward.objects.exists(): return

        def create_reward(points, value, is_percent, desc_pl, desc_en):
            reward = LoyaltyReward.objects.create(
                points_required=points,
                reward_value=value,
                is_percentage=is_percent,
                active=True
            )
            reward.set_current_language('pl');
            reward.description = desc_pl;
            reward.save()
            reward.set_current_language('en');
            reward.description = desc_en;
            reward.save()

        create_reward(500, 20.00, False, "Rabat 20 PLN", "Discount 20 PLN")
        create_reward(1000, 50.00, False, "Super Rabat 50 PLN", "Super Discount 50 PLN")
        create_reward(5000, 15.00, True, "Złoty status: -15%", "Gold Status: -15%")
