# products/management/commands/seed_db.py

import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

# --- IMPORTUJEMY WSZYSTKIE MODELE ---
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
    help = 'Wypełnia bazę danych danymi testowymi dla sklepu z baliami (używając `rafal` i `anna_nowak`)'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.faker = Faker('pl_PL')

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

        self.stdout.write(self.style.WARNING(
            'Rozpoczynanie czyszczenia starych danych (Użytkownicy ZOSTANĄ)...'
        ))
        self._clear_data()

        self.stdout.write(self.style.NOTICE(
            'Tworzenie nowych danych...'
        ))

        # 1. Pobierz lub stwórz użytkowników `rafal` i `anna_nowak`
        users = self._get_or_create_users()
        if not users:
            self.stdout.write(self.style.ERROR(
                "Nie udało się pobrać/stworzyć użytkowników. Przerwanie."
            ))
            return

        # 2. Stwórz dane
        categories = self._create_categories()
        attributes = self._create_attributes_and_values()

        # 3. Stwórz produkty
        products = self._create_products(categories, amount)

        # 4. Stwórz warianty dla tych produktów
        variants = self._create_variants(products, attributes)

        # 5. Stwórz losowe zamówienia dla `anna_nowak`
        self._create_orders(users['anna_nowak'], variants)

        self.stdout.write(self.style.SUCCESS(
            f'Baza danych została pomyślnie wypełniona {amount} produktami!'
        ))

    def _clear_data(self):
        """Usuwa wszystkie dane transakcyjne, ZOSTAWIAJĄC UŻYTKOWNIKÓW."""
        self.stdout.write("  Usuwanie starych zamówień...")
        OrderItem.objects.all().delete()
        Order.objects.all().delete()

        self.stdout.write("  Usuwanie starych zdjęć, wariantów i produktów...")
        ProductImage.objects.all().delete()
        ProductVariant.objects.all().delete()
        Product.objects.all().delete()

        self.stdout.write("  Usuwanie starych kategorii i atrybutów...")
        Category.objects.all().delete()
        AttributeValue.objects.all().delete()
        ProductAttribute.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("  Stare dane (poza użytkownikami) usunięte."))

    def _get_or_create_users(self):
        """
        Pobiera lub tworzy specyficznych użytkowników `rafal` (admin)
        i `anna_nowak` (tester).
        """
        self.stdout.write("  Sprawdzanie/tworzenie użytkowników `rafal` i `anna_nowak`...")

        # --- Użytkownik Admin: rafal ---
        admin_user, admin_created = User.objects.get_or_create(
            username='rafal',
            defaults={
                'email': 'rafal123@gmail.com',
                'first_name': 'Rafał',
                'last_name': 'Rafał',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )

        if admin_created:
            admin_user.set_password('BardzoSilneHaslo123!')
            admin_user.save()
            EmailAddress.objects.create(
                user=admin_user,
                email=admin_user.email,
                primary=True,
                verified=True
            )
            self.stdout.write(self.style.SUCCESS(f"  Stworzono admina 'rafal'."))
        else:
            # Upewnij się, że istniejący 'rafal' jest adminem
            if not admin_user.is_staff:
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()
            self.stdout.write(self.style.NOTICE(f"  Znaleziono admina 'rafal'."))

        # --- Użytkownik Testowy: anna_nowak ---
        tester_user, tester_created = User.objects.get_or_create(
            username='anna_nowak',
            defaults={
                'email': 'nowy_uzytkownik@przyklad.pl',
                'first_name': 'Anna',
                'last_name': 'Nowak',
                'is_active': True,
                'is_staff': False,  # Upewniamy się, że nie jest adminem
                'is_superuser': False
            }
        )

        if tester_created:
            tester_user.set_password('BardzoSilneHaslo123!')
            tester_user.save()
            EmailAddress.objects.create(
                user=tester_user,
                email=tester_user.email,
                primary=True,
                verified=True
            )
            self.stdout.write(self.style.SUCCESS(f"  Stworzono użytkownika 'anna_nowak'."))
        else:
            self.stdout.write(self.style.NOTICE(f"  Znaleziono użytkownika 'anna_nowak'."))

        return {'admin': admin_user, 'anna_nowak': tester_user}

    def _create_categories(self):
        self.stdout.write('  Tworzenie kategorii...')
        balie = Category.objects.create(name='Balie Ogrodowe')
        jacuzzi = Category.objects.create(name='Jacuzzi Ogrodowe', parent=balie)
        drewniane = Category.objects.create(name='Balie Drewniane', parent=balie)
        akcesoria = Category.objects.create(name='Akcesoria')
        pokrywy = Category.objects.create(name='Pokrywy Termiczne', parent=akcesoria)

        return {
            'jacuzzi': jacuzzi,
            'drewniane': drewniane,
            'pokrywy': pokrywy
        }

    def _create_attributes_and_values(self):
        self.stdout.write('  Tworzenie atrybutów i wartości...')

        piec_attr = ProductAttribute.objects.create(name='Typ pieca')
        piec_drewno = AttributeValue.objects.create(attribute=piec_attr, value='Piec na drewno (zewnętrzny)')
        piec_elektr = AttributeValue.objects.create(attribute=piec_attr, value='Piec elektryczny 8kW')

        wklad_attr = ProductAttribute.objects.create(name='Materiał wkładu')
        wklad_akryl = AttributeValue.objects.create(attribute=wklad_attr, value='Akryl (Biała Perła)')
        wklad_pp = AttributeValue.objects.create(attribute=wklad_attr, value='Polipropylen (Szary)')

        masaz_attr = ProductAttribute.objects.create(name='Hydromasaż')
        masaz_tak = AttributeValue.objects.create(attribute=masaz_attr, value='System 8 dysz')
        masaz_nie = AttributeValue.objects.create(attribute=masaz_attr, value='Brak')

        return {
            'piece': [piec_drewno, piec_elektr],
            'wklady': [wklad_akryl, wklad_pp],
            'masaze': [masaz_tak, masaz_nie]
        }

    def _create_products(self, categories, amount):
        self.stdout.write(f'  Tworzenie {amount} produktów (matek)...')
        products_list = []
        lista_kategorii = [categories['jacuzzi'], categories['drewniane']]

        for i in range(amount):
            nazwa = f'Balia Ogrodowa Model {self.faker.word().capitalize()} {i + 1}'
            product = Product.objects.create(
                name=nazwa,
                slug=self.faker.slug(nazwa),
                category=random.choice(lista_kategorii),
                description=self.faker.paragraph(nb_sentences=10)
            )
            products_list.append(product)
        return products_list

    def _create_variants(self, products, attributes):
        self.stdout.write('  Tworzenie wariantów dla produktów...')
        variants_list = []
        for product in products:
            # Stwórz od 1 do 3 wariantów dla każdego produktu
            for i in range(random.randint(1, 3)):
                piec = random.choice(attributes['piece'])
                wklad = random.choice(attributes['wklady'])
                masaz = random.choice(attributes['masaze'])

                cena_bazowa = Decimal(random.uniform(9000, 15000))
                if piec.value == 'Piec elektryczny 8kW':
                    cena_bazowa += 2000
                if wklad.value == 'Akryl (Biała Perła)':
                    cena_bazowa += 1500
                if masaz.value == 'System 8 dysz':
                    cena_bazowa += 2500

                nazwa_wariantu = f'{piec.value}, {wklad.value}, {masaz.value}'

                variant = ProductVariant.objects.create(
                    product=product,
                    name=nazwa_wariantu,
                    sku=f'SKU-{product.id}-{i}',
                    price=cena_bazowa.quantize(Decimal('0.01')),
                    stock=random.randint(0, 50)
                )
                variant.attributes.add(piec, wklad, masaz)
                variants_list.append(variant)
        return variants_list

    def _create_orders(self, user, variants):
        self.stdout.write(f"  Tworzenie 10 losowych zamówień dla '{user.username}'...")

        if not variants:
            self.stdout.write(self.style.WARNING("  Pominięto tworzenie zamówień (brak wariantów)."))
            return

        for _ in range(10):
            items_in_order = random.sample(variants, random.randint(1, 3))
            total_price = Decimal('0.00')

            order = Order.objects.create(
                user=user,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                address=self.faker.street_address(),
                postal_code=self.faker.postcode(),
                city=self.faker.city(),
                paid=random.choice([True, False]),
                status=random.choice(['pending', 'processing', 'completed'])
            )

            items_to_create = []
            for variant in items_in_order:
                quantity = random.randint(1, 2)
                price = variant.price
                total_price += (price * quantity)

                items_to_create.append(
                    OrderItem(
                        order=order,
                        variant=variant,
                        product_name=str(variant),
                        price=price,
                        quantity=quantity
                    )
                )

            OrderItem.objects.bulk_create(items_to_create)
            order.total_price = total_price
            order.save(update_fields=['total_price'])
