import pytest
from datetime import timedelta, datetime, timezone as dt_timezone
from decimal import Decimal
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from orders.models import Order, OrderItem
from products.models import Product, ProductVariant, Category

Order.__str__ = lambda self: f"Order {self.pk}"
OrderItem.__str__ = lambda self: f"Item {self.pk}"
ProductVariant.__str__ = lambda self: f"Variant {self.pk}"
Product.__str__ = lambda self: f"Product {self.pk}"
Category.__str__ = lambda self: f"Category {self.pk}"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_user(
        username="admin", password="password", is_staff=True, is_superuser=True
    )


@pytest.fixture
def sample_data():
    category = Category.objects.create(slug="cat-1")
    category.set_current_language('pl')
    category.name = "Kategoria 1"
    category.save()

    product = Product.objects.create(category=category, slug="prod-1")
    product.set_current_language('pl')
    product.name = "Produkt 1"
    product.save()

    variant = ProductVariant.objects.create(
        product=product, sku="SKU-1", price=100.00, stock=50, available=True
    )
    variant.set_current_language('pl')
    variant.name = "Wariant 1"
    variant.save()

    return category, product, variant


def create_order(user, variant, date, price=100, quantity=1, paid=True):
    order = Order.objects.create(
        user=user,
        total_price=Decimal(price * quantity),
        paid=paid
    )
    order.created_at = date
    order.save()

    OrderItem.objects.create(
        order=order,
        variant=variant,
        price=Decimal(price),
        quantity=quantity
    )
    return order


@pytest.mark.django_db
def test_monthly_statistics_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data
    now = timezone.now()

    create_order(None, variant, now, price=200)
    create_order(None, variant, now - timedelta(days=35), price=100)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:monthly-statistics')
    except:
        url = '/api/v1/reports/monthly/'

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = response.data
    assert len(data['monthly_data']) >= 2
    assert data['summary']['total_revenue'] == 300.0

    last_month = data['monthly_data'][-1]
    assert last_month['revenue'] == 200.0

    prev_month = data['monthly_data'][-2]
    assert prev_month['revenue'] == 100.0

    assert last_month['growth_rate'] == 100.0


@pytest.mark.django_db
def test_quarterly_statistics_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data
    year = timezone.now().year

    create_order(None, variant, datetime(year, 2, 15, tzinfo=dt_timezone.utc), price=100)
    create_order(None, variant, datetime(year, 5, 15, tzinfo=dt_timezone.utc), price=200)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:quarterly-statistics')
    except:
        url = '/api/v1/reports/quarterly/'

    response = api_client.get(url, {'year': year})

    assert response.status_code == status.HTTP_200_OK
    results = response.data['quarterly_data']
    assert len(results) >= 2

    q1 = next(r for r in results if 'Q1' in r['quarter'])
    q2 = next(r for r in results if 'Q2' in r['quarter'])

    assert q1['revenue'] == 100.0
    assert q2['revenue'] == 200.0
    assert q2['growth_rate'] == 100.0


@pytest.mark.django_db
def test_yearly_statistics_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data
    now = timezone.now()

    create_order(None, variant, now, price=500)
    create_order(None, variant, now - timedelta(days=400), price=300)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:yearly-statistics')
    except:
        url = '/api/v1/reports/yearly/'

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    results = response.data['yearly_data']
    assert len(results) >= 2

    current_year_stat = results[-1]
    assert current_year_stat['revenue'] == 500.0


@pytest.mark.django_db
def test_period_comparison_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data

    create_order(None, variant, datetime(2023, 1, 10, tzinfo=dt_timezone.utc), price=100)
    create_order(None, variant, datetime(2023, 2, 10, tzinfo=dt_timezone.utc), price=150)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:period-comparison')
    except:
        url = '/api/v1/reports/comparison/'

    params = {
        'period1_start': '2023-01-01',
        'period1_end': '2023-01-31',
        'period2_start': '2023-02-01',
        'period2_end': '2023-02-28'
    }

    response = api_client.get(url, params)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['period1']['stats']['revenue'] == 100.0
    assert response.data['period2']['stats']['revenue'] == 150.0
    assert response.data['comparison']['revenue_difference'] == -50.0


@pytest.mark.django_db
def test_top_products_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data
    now = timezone.now()

    create_order(None, variant, now, price=200, quantity=2)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:top-products')
    except:
        url = '/api/v1/reports/top-products/'

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    top = response.data['top_products']
    assert len(top) == 1
    assert top[0]['product_id'] == product.id
    assert top[0]['quantity_sold'] == 2
    assert top[0]['revenue'] == 400.0


@pytest.mark.django_db
def test_category_performance_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data
    now = timezone.now()

    create_order(None, variant, now, price=150)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:category-performance')
    except:
        url = '/api/v1/reports/categories/'

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    cats = response.data['categories']
    assert len(cats) == 1
    assert cats[0]['category_id'] == category.id
    assert cats[0]['revenue'] == 150.0
    assert cats[0]['revenue_percentage'] == 100.0


@pytest.mark.django_db
def test_dashboard_overview_view(api_client, admin_user, sample_data):
    category, product, variant = sample_data
    now = timezone.now()

    create_order(None, variant, now, price=100)

    prev_month = now.replace(day=1) - timedelta(days=5)
    create_order(None, variant, prev_month, price=50)

    api_client.force_authenticate(user=admin_user)

    try:
        url = reverse('orders:dashboard-overview')
    except:
        url = '/api/v1/reports/dashboard/'

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['today']['revenue'] == 100.0
    assert response.data['current_month']['revenue'] == 100.0
    assert response.data['previous_month']['revenue'] == 50.0
    assert response.data['current_month']['growth_rate'] == 100.0