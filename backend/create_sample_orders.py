#!/usr/bin/env python
"""Create sample orders with proper variants"""
import os
import django
import random
from decimal import Decimal
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from django.utils import timezone
from orders.models import Order, OrderItem
from products.models import ProductVariant
from users.models import CustomUser

# Delete old orders
print("Usuwam stare zamówienia...")
old_count = Order.objects.count()
Order.objects.all().delete()
print(f"Usunięto {old_count} starych zamówień")

# Get all variants
variants = list(ProductVariant.objects.select_related('product').all())
print(f"\nDostępne warianty: {len(variants)}")

# Get or create test user
user, created = CustomUser.objects.get_or_create(
    email='test@example.com',
    defaults={
        'username': 'testuser',
        'first_name': 'Jan',
        'last_name': 'Kowalski',
        'is_active': True
    }
)
if created:
    user.set_password('testpass123')
    user.save()

# Generate orders for last 90 days
print("\nTworzę nowe zamówienia...")
now = timezone.now()
statuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled']
cities = ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Łódź', 'Szczecin']
first_names = ['Jan', 'Anna', 'Piotr', 'Maria', 'Tomasz', 'Katarzyna', 'Krzysztof', 'Magdalena']
last_names = ['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski']

orders_created = 0
total_items = 0

for i in range(50):  # Create 50 orders
    # Random date in last 90 days
    days_ago = random.randint(0, 90)
    order_date = now - timedelta(days=days_ago)
    
    # Random status (80% paid)
    is_paid = random.random() < 0.8
    status = random.choice(statuses)
    
    # Create order
    order = Order.objects.create(
        user=user if random.random() < 0.5 else None,  # 50% with user, 50% guest
        first_name=random.choice(first_names),
        last_name=random.choice(last_names),
        email=f'customer{i}@example.com',
        phone=f'+48{random.randint(500000000, 999999999)}',
        address=f'ul. Testowa {random.randint(1, 100)}',
        postal_code=f'{random.randint(10, 99)}-{random.randint(100, 999)}',
        city=random.choice(cities),
        notes='Testowe zamówienie' if random.random() < 0.3 else '',
        paid=is_paid,
        status=status,
        created_at=order_date,
        updated_at=order_date + timedelta(hours=random.randint(1, 48)),
        tracking_number=f'TRK{random.randint(100000, 999999)}' if status in ['shipped', 'completed'] else None
    )
    
    # Add 1-4 items to order
    num_items = random.randint(1, 4)
    order_total = Decimal('0.00')
    
    for _ in range(num_items):
        variant = random.choice(variants)
        quantity = random.randint(1, 3)
        price = variant.price
        
        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name=f"{variant.product.name} - {variant.name}",
            price=price,
            quantity=quantity
        )
        
        order_total += price * quantity
        total_items += 1
    
    # Update order total
    order.total_price = order_total
    order.save()
    
    orders_created += 1

print(f"\n✅ Utworzono {orders_created} zamówień z {total_items} pozycjami")
print(f"✅ Opłaconych: {Order.objects.filter(paid=True).count()}")
print(f"✅ Wszystkie OrderItems mają variant: {OrderItem.objects.filter(variant__isnull=False).count()}/{OrderItem.objects.count()}")
