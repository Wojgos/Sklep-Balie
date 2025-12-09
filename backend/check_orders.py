import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from orders.models import Order

oldest = Order.objects.filter(created_at__isnull=False).order_by('created_at').first()
newest = Order.objects.filter(created_at__isnull=False).order_by('-created_at').first()
total = Order.objects.count()
paid = Order.objects.filter(paid=True).count()

print("\n" + "="*60)
print("STATYSTYKI ZAMÓWIEŃ")
print("="*60)
print(f"Łącznie zamówień: {total}")
print(f"Opłacone: {paid} ({paid/total*100:.1f}%)")
print(f"Nieopłacone: {total-paid} ({(total-paid)/total*100:.1f}%)")
print(f"\nZakres dat:")
if oldest and newest:
    print(f"  Najstarsze: {oldest.created_at.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Najnowsze: {newest.created_at.strftime('%Y-%m-%d %H:%M')}")
    days_diff = (newest.created_at - oldest.created_at).days
    print(f"  Okres: {days_diff} dni (~{days_diff/365:.1f} lat)")

print("\nStatusy:")
for status_code, status_name in Order.STATUS_CHOICES:
    count = Order.objects.filter(status=status_code).count()
    pct = count/total*100 if total > 0 else 0
    print(f"  • {status_name}: {count} ({pct:.1f}%)")
print("="*60 + "\n")
