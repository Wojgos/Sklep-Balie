import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from django.utils import timezone
from orders.models import Order, OrderItem
from products.models import Product, ProductVariant, Category

# --- MONKEY PATCHING (BEZPIECZNIK) ---
# Zabezpieczamy się przed błędami w __str__ podczas debugowania
Order.__str__ = lambda self: f"Order {self.pk}"
OrderItem.__str__ = lambda self: f"Item {self.pk}"
ProductVariant.__str__ = lambda self: f"Variant {self.pk}"
Product.__str__ = lambda self: f"Product {self.pk}"


# -------------------------------------

# --- FIXTURY ---

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        username="client", password="password", email="client@test.com"
    )


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_user(
        username="admin", password="password", is_staff=True, is_superuser=True
    )


@pytest.fixture
def variant():
    # 1. Tworzymy Kategorię z tłumaczeniem
    category = Category.objects.create(slug="cat")
    category.set_current_language('pl')
    category.name = "Kategoria Testowa"
    category.save()

    # 2. Tworzymy Produkt z tłumaczeniem
    product = Product.objects.create(category=category, slug="prod")
    product.set_current_language('pl')
    product.name = "Produkt Testowy"
    product.save()

    # 3. Tworzymy Wariant z tłumaczeniem
    variant = ProductVariant.objects.create(
        product=product, sku="SKU1", price=100.00, stock=10, available=True
    )
    variant.set_current_language('pl')
    variant.name = "Wariant Testowy"
    variant.save()

    return variant


# --- TESTY ---

@pytest.mark.django_db
def test_create_order_success(api_client, user, variant):
    api_client.force_authenticate(user=user)

    url = reverse('orders:order-list')
    data = {
        "first_name": "Jan",
        "last_name": "Kowalski",
        "email": "jan@test.com",
        "phone_number": "123456789",
        "address": "Ulica 1",
        "city": "Miasto",
        "postal_code": "00-000",
        "items": [
            {"variant_id": variant.id, "quantity": 2}
        ]
    }

    # Ważne: Wymuszamy język PL, aby pasował do danych w fixturze
    with patch('orders.views.send_invoice_email_task.delay') as mock_task:
        response = api_client.post(url, data, format='json', HTTP_ACCEPT_LANGUAGE='pl')

    assert response.status_code == status.HTTP_201_CREATED
    assert Order.objects.count() == 1
    assert OrderItem.objects.count() == 1

    order = Order.objects.first()
    assert order.user == user
    assert order.total_price == Decimal('200.00')

    variant.refresh_from_db()
    assert variant.stock == 8


@pytest.mark.django_db
def test_create_order_insufficient_stock(api_client, user, variant):
    api_client.force_authenticate(user=user)

    variant.stock = 1
    variant.save()

    url = reverse('orders:order-list')
    data = {
        "first_name": "Jan",
        "last_name": "Kowalski",
        "email": "jan@test.com",
        "phone_number": "123456789",
        "address": "Ulica 1",
        "city": "Miasto",
        "postal_code": "00-000",
        "items": [
            {"variant_id": variant.id, "quantity": 2}
        ]
    }

    # Wymuszamy język PL, aby backend znalazł tłumaczenie nazwy wariantu do komunikatu błędu
    response = api_client.post(url, data, format='json', HTTP_ACCEPT_LANGUAGE='pl')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Niewystarczający stan magazynowy" in str(response.data)


@pytest.mark.django_db
def test_list_orders_permissions(api_client, user, admin_user, variant):
    order_user = Order.objects.create(user=user, total_price=100, first_name="User", email="u@u.pl")
    order_other = Order.objects.create(total_price=100, first_name="Other", email="o@o.pl")

    url = reverse('orders:order-list')

    # 1. Zwykły user widzi tylko swoje
    api_client.force_authenticate(user=user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 1
    assert response.data['results'][0]['id'] == order_user.id

    # 2. Admin widzi wszystkie
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 2


@pytest.mark.django_db
def test_sales_stats_view(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)

    today = timezone.now().date()
    Order.objects.create(total_price=100, paid=True, created_at=timezone.now())
    Order.objects.create(total_price=50, paid=True, created_at=timezone.now())
    Order.objects.create(total_price=200, paid=False, created_at=timezone.now())

    url = reverse('orders:sales-stats')
    response = api_client.get(url, {
        'start_date': str(today),
        'end_date': str(today)
    })

    assert response.status_code == status.HTTP_200_OK
    assert response.data['summary']['total_revenue'] == 150.0
    assert response.data['summary']['total_orders'] == 2


@pytest.mark.django_db
def test_order_invoice_view(api_client, user):
    order = Order.objects.create(user=user, total_price=100, first_name="Jan", email="j@j.pl")
    api_client.force_authenticate(user=user)

    url = reverse('orders:order-invoice', kwargs={'order_id': order.id})

    with patch('orders.views.generate_invoice_pdf', return_value=b'%PDF-1.4 Fake Content'):
        response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response['Content-Type'] == 'application/pdf'