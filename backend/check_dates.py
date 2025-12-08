import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from orders.models import Order
from django.db.models import Min, Max, Count
from django.db.models.functions import TruncMonth

# Min i max
result = Order.objects.aggregate(min_date=Min('created_at'), max_date=Max('created_at'))
print(f"Najstarsza data: {result['min_date']}")
print(f"Najnowsza data: {result['max_date']}")

# Rozkład po miesiącach
print("\n=== Zamówienia według miesięcy ===")
orders_by_month = Order.objects.annotate(month=TruncMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month')
for item in orders_by_month:
    print(f"{item['month'].strftime('%Y-%m')}: {item['count']} zamówień")
