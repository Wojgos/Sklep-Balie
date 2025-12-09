from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import random
from datetime import timedelta

from orders.models import Order, OrderItem
from products.models import ProductVariant
from users.models import CustomUser


class Command(BaseCommand):
    help = 'Delete old orders and create new test orders with proper variants'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Starting order seeding...')

        # Delete all existing orders (cascade will delete items)
        old_count = Order.objects.count()
        Order.objects.all().delete()
        self.stdout.write(f'Deleted {old_count} old orders')

        # Get all available variants
        variants = list(ProductVariant.objects.filter(available=True, stock__gt=0))
        if not variants:
            self.stdout.write(self.style.ERROR('No variants available! Run seed_sample_products first.'))
            return

        self.stdout.write(f'Found {len(variants)} available variants')

        # Sample customer data
        first_names = ['Jan', 'Anna', 'Piotr', 'Maria', 'Krzysztof', 'Ewa', 'Tomasz', 'Joanna']
        last_names = ['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski']
        cities = ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Łódź']
        statuses = ['pending', 'processing', 'shipped', 'completed']

        created_orders = 0
        created_items = 0

        # Create 50 orders over the last 90 days
        now = timezone.now()
        for i in range(50):
            # Random date in last 90 days
            days_ago = random.randint(0, 90)
            order_date = now - timedelta(days=days_ago)

            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            city = random.choice(cities)
            status = random.choice(statuses)
            paid = random.choice([True, True, True, False])  # 75% paid

            order = Order.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=f'{first_name.lower()}.{last_name.lower()}@example.com',
                phone=f'+48{random.randint(500000000, 999999999)}',
                address=f'ul. Testowa {random.randint(1, 100)}/{random.randint(1, 20)}',
                city=city,
                postal_code=f'{random.randint(10, 99)}-{random.randint(100, 999)}',
                status=status,
                paid=paid,
                created_at=order_date,
                updated_at=order_date
            )

            # Add 1-4 random items to the order
            num_items = random.randint(1, 4)
            total_price = Decimal('0.00')

            for _ in range(num_items):
                variant = random.choice(variants)
                quantity = random.randint(1, 3)
                price = variant.price

                OrderItem.objects.create(
                    order=order,
                    variant=variant,
                    product_name=variant.product.safe_translation_getter('name', any_language=True) or f'Product {variant.product.id}',
                    price=price,
                    quantity=quantity
                )

                total_price += price * quantity
                created_items += 1

            # Update order total
            order.total_price = total_price
            order.save()
            created_orders += 1

        self.stdout.write(self.style.SUCCESS(
            f'Successfully created {created_orders} orders with {created_items} items'
        ))
        self.stdout.write(f'Paid orders: {Order.objects.filter(paid=True).count()}')
        self.stdout.write(f'Total revenue: {sum(o.total_price for o in Order.objects.filter(paid=True))} PLN')
