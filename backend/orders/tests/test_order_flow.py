# backend/orders/tests/test_order_flow.py
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from products.models import Product, Category, ProductVariant

User = get_user_model()


# @pytest.mark.django_db mówi testowi: "możesz używać bazy danych"
@pytest.mark.django_db
def test_create_order_reduces_stock_and_adds_points():
    """
    Testuje, czy złożenie zamówienia:
    1. Tworzy obiekt Order.
    2. Zmniejsza stan magazynowy wariantu.
    3. Przyznaje punkty lojalnościowe użytkownikowi.
    """

    client = APIClient()

    user = User.objects.create_user(
        username='testuser', password='password', email='test@test.com',
        loyalty_points=0
    )
    client.force_authenticate(user=user)

    category = Category.objects.create(name="Test Category", slug="test-category")
    product = Product.objects.create(name="Balia Testowa", category=category)

    variant = ProductVariant.objects.create(
        product=product,
        sku="TEST-SKU-001",
        price=Decimal("1000.00"),
        stock=10,
        available=True
    )

    payload = {
        "first_name": "Jan",
        "last_name": "Testowy",
        "email": "jan@test.com",
        "address": "Ulica 1",
        "postal_code": "00-000",
        "city": "Miasto",
        "items": [
            {
                "variant_id": variant.id,
                "quantity": 2
            }
        ]
    }

    response = client.post('/api/v1/orders/', payload, format='json')

    assert response.status_code == 201, f"Błąd API: {response.data}"

    variant.refresh_from_db()
    assert variant.stock == 8

    user.refresh_from_db()
    assert user.loyalty_points == 200
