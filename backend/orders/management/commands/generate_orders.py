"""
Management command to generate test orders for statistics.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random
from datetime import datetime, timedelta

from orders.models import Order, OrderItem
from products.models import ProductVariant

User = get_user_model()

class Command(BaseCommand):
    help = 'Generates 200 test orders with random dates for statistics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=200,
            help='Number of orders to generate (default: 200)'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        self.stdout.write(self.style.WARNING(f'Generating {count} test orders...'))
        
        # Get or create test users
        users = list(User.objects.all())
        if not users:
            self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
            return
        
        # Get available product variants
        variants = list(ProductVariant.objects.filter(available=True, stock__gt=0))
        if not variants:
            self.stdout.write(self.style.ERROR('No product variants found. Please seed products first.'))
            return
        
        self.stdout.write(f'Found {len(users)} users and {len(variants)} product variants')
        
        # Order statuses with weights (more completed/delivered orders)
        statuses = [
            ('pending', 5),
            ('processing', 10),
            ('shipped', 15),
            ('delivered', 60),
            ('cancelled', 10),
        ]
        
        # Generate orders over last 2 years
        end_date = timezone.now()
        start_date = end_date - timedelta(days=730)  # 2 years
        
        created_count = 0
        failed_count = 0
        
        for i in range(count):
            try:
                # Random date in the last 2 years
                days_ago = random.randint(0, 730)
                order_date = end_date - timedelta(days=days_ago)
                
                # Random user
                user = random.choice(users)
                
                # Random status based on weights
                status = random.choices(
                    [s[0] for s in statuses],
                    weights=[s[1] for s in statuses]
                )[0]
                
                # Paid is True for delivered/shipped orders, and 80% for others
                paid = status in ['delivered', 'shipped'] or random.random() < 0.8
                
                # Generate random contact info
                first_name = f"Test{random.randint(1, 100)}"
                last_name = f"User{random.randint(1, 100)}"
                email = f"{first_name.lower()}{last_name.lower()}@test.com"
                
                # Create order with specific date
                order = Order.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    address=f"ul. Testowa {random.randint(1, 100)}",
                    postal_code=f"{random.randint(10, 99)}-{random.randint(100, 999)}",
                    city="Warszawa",
                    status=status,
                    paid=paid,
                    total_price=Decimal('0.00'),
                    discount_amount=Decimal('0.00'),
                    created_at=order_date,
                    updated_at=order_date
                )
                
                # Add 1-5 random items to order
                num_items = random.randint(1, 5)
                order_total = Decimal('0.00')
                
                selected_variants = random.sample(variants, min(num_items, len(variants)))
                
                for variant in selected_variants:
                    quantity = random.randint(1, 3)
                    price = variant.price  # Price is in the variant, not product
                    
                    # Add small random variation to price (discounts, etc)
                    price_variation = random.uniform(0.85, 1.0)
                    item_price = price * Decimal(str(price_variation))
                    
                    # Get product name
                    product_name = variant.product.safe_translation_getter('name', any_language=True) if variant.product else f"Product {variant.sku}"
                    
                    OrderItem.objects.create(
                        order=order,
                        variant=variant,
                        product_name=product_name,
                        quantity=quantity,
                        price=str(item_price)
                    )
                    
                    order_total += item_price * quantity
                
                # Apply random discount (20% chance)
                if random.random() < 0.2:
                    discount = order_total * Decimal(str(random.uniform(0.05, 0.2)))
                    order.discount_amount = discount
                    order_total -= discount
                
                order.total_price = order_total
                order.save()
                
                created_count += 1
                
                if (i + 1) % 50 == 0:
                    self.stdout.write(f'Created {i + 1}/{count} orders...')
                    
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Failed to create order {i + 1}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully created {created_count} orders!'
            )
        )
        
        if failed_count > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠️  Failed to create {failed_count} orders')
            )
        
        # Print summary statistics
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('ORDER GENERATION SUMMARY'))
        self.stdout.write('='*50)
        
        total_orders = Order.objects.count()
        paid_orders = Order.objects.filter(paid=True).count()
        total_revenue = sum(
            float(order.total_price) 
            for order in Order.objects.filter(paid=True)
        )
        
        self.stdout.write(f'Total orders in database: {total_orders}')
        self.stdout.write(f'Paid orders: {paid_orders}')
        self.stdout.write(f'Total revenue: {total_revenue:.2f} PLN')
        
        status_counts = {}
        for status, _ in statuses:
            count = Order.objects.filter(status=status).count()
            status_counts[status] = count
            self.stdout.write(f'  - {status}: {count}')
        
        self.stdout.write('\n' + self.style.SUCCESS('✨ Done!'))
