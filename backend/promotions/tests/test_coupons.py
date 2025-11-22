# backend/promotions/tests/test_coupons.py
import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from products.models import Product, Category, ProductVariant
from promotions.models import DiscountCoupon

User = get_user_model()


@pytest.mark.django_db
def test_apply_valid_coupon_reduces_price():
    """
    Testuje, czy użycie ważnego kuponu obniża cenę zamówienia.
    """
    # 1. SETUP
    client = APIClient()
    user = User.objects.create_user(username='test', password='pw', email='t@t.com')
    client.force_authenticate(user=user)

    # Produkt za 100 zł
    category = Category.objects.create(name="Kat")
    product = Product.objects.create(name="Produkt", category=category)
    variant = ProductVariant.objects.create(
        product=product, sku="SKU1", price=Decimal("100.00"), stock=10, available=True
    )

    # Kupon -20%
    coupon = DiscountCoupon.objects.create(
        code="TEST20",
        value=20,
        is_percentage=True,
        active=True,
        valid_from=timezone.now(),
        valid_to=timezone.now() + timedelta(days=1),
        usage_limit=10
    )

    # 2. AKCJA
    payload = {
        "first_name": "Jan",
        "last_name": "Test",
        "email": "j@t.com",
        "address": "Ul 1",
        "postal_code": "00",
        "city": "M",
        "coupon_code": "TEST20",  # <-- Używamy kuponu
        "items": [{"variant_id": variant.id, "quantity": 1}]
    }

    response = client.post('/api/v1/orders/', payload, format='json')

    # 3. WERYFIKACJA
    assert response.status_code == 201
    # Cena powinna wynosić 80.00 (100 - 20%)
    assert Decimal(response.data['total_price']) == Decimal("80.00")

    # Sprawdź czy licznik użycia kuponu wzrósł
    coupon.refresh_from_db()
    assert coupon.usage_count == 1