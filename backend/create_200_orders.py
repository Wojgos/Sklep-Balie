#!/usr/bin/env python
"""Create 200 sample orders spanning last 5 years"""
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

# Get all variants
variants = list(ProductVariant.objects.select_related('product').all())
print(f"Dostępne warianty: {len(variants)}")

if len(variants) == 0:
    print("BŁĄD: Brak wariantów produktów! Najpierw dodaj produkty.")
    exit(1)

# Get or create test users
users = []
for i in range(10):  # 10 test users
    user, created = CustomUser.objects.get_or_create(
        email=f'customer{i}@example.com',
        defaults={
            'username': f'customer{i}',
            'first_name': random.choice(['Jan', 'Anna', 'Piotr', 'Maria', 'Tomasz', 'Katarzyna', 'Krzysztof', 'Magdalena']),
            'last_name': random.choice(['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski']),
            'is_active': True
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
    users.append(user)

print(f"Przygotowano {len(users)} użytkowników testowych")

# Generate 200 orders for last 5 years (1825 days)
print("\nTworzę 200 zamówień z ostatnich 5 lat...")
now = timezone.now()
statuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled']
status_weights = [0.05, 0.10, 0.15, 0.65, 0.05]  # Most orders completed

cities = ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Łódź', 'Szczecin', 'Katowice', 'Bydgoszcz', 'Lublin']
first_names = ['Jan', 'Anna', 'Piotr', 'Maria', 'Tomasz', 'Katarzyna', 'Krzysztof', 'Magdalena', 'Paweł', 'Joanna', 
               'Michał', 'Ewa', 'Marcin', 'Agnieszka', 'Wojciech', 'Monika']
last_names = ['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 
              'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski']

orders_created = 0
total_items = 0
total_value = Decimal('0.00')

# Distribution: more recent orders have higher probability
# Last year: 40%, 2nd year: 25%, 3rd year: 20%, 4th year: 10%, 5th year: 5%
year_ranges = [
    (0, 365, 0.40),      # Last year
    (365, 730, 0.25),    # 2nd year
    (730, 1095, 0.20),   # 3rd year
    (1095, 1460, 0.10),  # 4th year
    (1460, 1825, 0.05),  # 5th year
]

orders_per_range = []
for start, end, weight in year_ranges:
    count = int(200 * weight)
    orders_per_range.append((start, end, count))

# Adjust last range to ensure exactly 200 orders
total_planned = sum(count for _, _, count in orders_per_range)
if total_planned != 200:
    orders_per_range[-1] = (orders_per_range[-1][0], orders_per_range[-1][1], 
                            orders_per_range[-1][2] + (200 - total_planned))

for range_start, range_end, num_orders in orders_per_range:
    for _ in range(num_orders):
        # Random date in this range
        days_ago = random.randint(range_start, range_end - 1)
        order_date = now - timedelta(days=days_ago)
        
        # Random status (85% paid, recent orders more likely to be pending/processing)
        if days_ago < 7:
            is_paid = random.random() < 0.70
            status = random.choices(statuses, weights=[0.15, 0.20, 0.20, 0.40, 0.05])[0]
        elif days_ago < 30:
            is_paid = random.random() < 0.80
            status = random.choices(statuses, weights=[0.10, 0.15, 0.20, 0.50, 0.05])[0]
        else:
            is_paid = random.random() < 0.90
            status = random.choices(statuses, weights=status_weights)[0]
        
        # 60% orders with registered user, 40% guest
        user = random.choice(users) if random.random() < 0.60 else None
        
        # Create order
        order = Order.objects.create(
            user=user,
            first_name=random.choice(first_names),
            last_name=random.choice(last_names),
            email=f'order{orders_created}@example.com',
            phone=f'+48{random.randint(500000000, 999999999)}',
            address=f'ul. {random.choice(["Główna", "Kwiatowa", "Długa", "Krótka", "Polna", "Leśna", "Słoneczna"])} {random.randint(1, 150)}{random.choice(["", "/", "A", "B"])}',
            postal_code=f'{random.randint(10, 99)}-{random.randint(100, 999)}',
            city=random.choice(cities),
            notes='Uwagi do zamówienia' if random.random() < 0.15 else '',
            paid=is_paid,
            status=status,
            created_at=order_date,
            updated_at=order_date + timedelta(hours=random.randint(1, 72)),
            tracking_number=f'TRK{random.randint(100000, 999999)}' if status in ['shipped', 'completed'] else None
        )
        
        # Add 1-5 items to order (weighted towards 1-2 items)
        num_items = random.choices([1, 2, 3, 4, 5], weights=[0.35, 0.35, 0.20, 0.08, 0.02])[0]
        order_total = Decimal('0.00')
        used_variants = set()
        
        for _ in range(num_items):
            # Select unique variant for this order
            attempts = 0
            while attempts < 10:
                variant = random.choice(variants)
                if variant.id not in used_variants:
                    used_variants.add(variant.id)
                    break
                attempts += 1
            
            quantity = random.choices([1, 2, 3, 4], weights=[0.70, 0.20, 0.08, 0.02])[0]
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
        total_value += order_total
        
        orders_created += 1
        
        # Progress indicator
        if orders_created % 20 == 0:
            print(f"  Utworzono {orders_created}/200 zamówień...")

print(f"\n{'='*60}")
print(f"✅ PODSUMOWANIE")
print(f"{'='*60}")
print(f"✅ Utworzono: {orders_created} zamówień")
print(f"✅ Pozycji w zamówieniach: {total_items}")
print(f"✅ Łączna wartość: {total_value:.2f} PLN")
print(f"✅ Średnia wartość zamówienia: {total_value/orders_created:.2f} PLN")
print(f"\nSTATUSTYKI:")
print(f"  • Opłacone: {Order.objects.filter(paid=True).count()}")
print(f"  • Nieopłacone: {Order.objects.filter(paid=False).count()}")
print(f"\nSTATUSY:")
for status_code, status_name in Order.STATUS_CHOICES:
    count = Order.objects.filter(status=status_code).count()
    print(f"  • {status_name}: {count}")
print(f"\nZAKRES DAT:")
oldest = Order.objects.order_by('created_at').first()
newest = Order.objects.order_by('-created_at').first()
if oldest:
    print(f"  • Najstarsze: {oldest.created_at.strftime('%Y-%m-%d')}")
if newest:
    print(f"  • Najnowsze: {newest.created_at.strftime('%Y-%m-%d')}")
print(f"{'='*60}")
