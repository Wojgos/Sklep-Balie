# backend/orders/tests/test_order_flow.py
import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from products.models import Product, Category, ProductVariant, AttributeValue, ProductAttribute

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

    # --- 1. PRZYGOTOWANIE DANYCH (SETUP) ---

    # Tworzymy klienta API
    client = APIClient()

    # Tworzymy użytkownika
    user = User.objects.create_user(
        username='testuser', password='password', email='test@test.com',
        loyalty_points=0
    )
    client.force_authenticate(user=user)  # Logujemy go "na siłę"

    # Tworzymy produkt i wariant
    category = Category.objects.create(name="Test Category", slug="test-category")
    product = Product.objects.create(name="Balia Testowa", category=category)

    variant = ProductVariant.objects.create(
        product=product,
        sku="TEST-SKU-001",
        price=Decimal("1000.00"),  # Cena: 1000 zł
        stock=10,  # Stan początkowy: 10 sztuk
        available=True
    )

    # --- 2. AKCJA (WYSŁANIE ŻĄDANIA) ---

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
                "quantity": 2  # Kupujemy 2 sztuki
            }
        ]
    }

    response = client.post('/api/v1/orders/', payload, format='json')

    # --- 3. WERYFIKACJA (ASSERTIONS) ---

    # A. Sprawdź czy API zwróciło sukces (201 Created)
    assert response.status_code == 201, f"Błąd API: {response.data}"

    # B. Sprawdź czy stan magazynowy się zmniejszył (10 - 2 = 8)
    variant.refresh_from_db()  # Odśwież dane z bazy
    assert variant.stock == 8

    # C. Sprawdź czy użytkownik dostał punkty
    # Zasada: 1 pkt za 10 zł. Wydano 2000 zł -> 200 pkt.
    user.refresh_from_db()
    assert user.loyalty_points == 200
