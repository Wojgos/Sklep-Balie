import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from products.models import Category, ProductAttribute, AttributeValue, ProductVariant


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_user(
        username="admin_test",
        password="password",
        is_staff=True,
        is_superuser=True
    )


@pytest.mark.django_db
def test_category_lookup_by_id(api_client):
    category = Category.objects.create(slug="test-cat")
    category.set_current_language('pl')
    category.name = "Test"
    category.save()

    url = reverse('products:category-detail', kwargs={'slug': str(category.id)})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['id'] == category.id


@pytest.mark.django_db
def test_category_lookup_by_slug(api_client):
    category = Category.objects.create(slug="unique-slug")
    category.set_current_language('pl')
    category.name = "Test Slug"
    category.save()

    url = reverse('products:category-detail', kwargs={'slug': 'unique-slug'})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['slug'] == 'unique-slug'


@pytest.mark.django_db
def test_product_attribute_values_action(api_client):
    attr = ProductAttribute.objects.create()
    attr.set_current_language('pl')
    attr.name = "Color"
    attr.save()

    val1 = AttributeValue.objects.create(attribute=attr)
    val1.set_current_language('pl')
    val1.value = "Red"
    val1.save()

    url = reverse('products:attribute-values', kwargs={'pk': attr.id})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['value'] == "Red"


@pytest.mark.django_db
def test_product_search_empty_query(api_client):
    url = reverse('products:product-search')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    if 'results' in response.data:
        assert len(response.data['results']) == 0
    else:
        assert len(response.data) == 0


@pytest.mark.django_db
def test_low_stock_viewset_permissions(api_client, admin_user):
    url = reverse('products:low-stock-variant-list')

    # Bez logowania
    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # Z logowaniem admina
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_low_stock_statistics(api_client, admin_user, product):
    ProductVariant.objects.create(product=product, sku="CRITICAL", stock=0, low_stock_threshold=10, available=True,
                                  price=100)
    ProductVariant.objects.create(product=product, sku="WARNING", stock=2, low_stock_threshold=10, available=True,
                                  price=100)
    ProductVariant.objects.create(product=product, sku="MILD", stock=8, low_stock_threshold=10, available=True,
                                  price=100)
    ProductVariant.objects.create(product=product, sku="OK", stock=20, low_stock_threshold=10, available=True,
                                  price=100)

    api_client.force_authenticate(user=admin_user)
    url = reverse('products:low-stock-variant-statistics')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    stats = response.data
    assert stats['total_variants'] == 4
    assert stats['low_stock_count'] == 3
    assert stats['critical_count'] == 1
    assert stats['warning_count'] == 1
    assert stats['ok_count'] == 1


@pytest.mark.django_db
@patch('products.views.check_low_stock_levels.delay')
def test_low_stock_trigger_alert_success(mock_task, api_client, admin_user):
    mock_result = MagicMock()
    mock_result.get.return_value = "Alert sent"
    mock_task.return_value = mock_result

    api_client.force_authenticate(user=admin_user)
    url = reverse('products:low-stock-variant-trigger-alert')
    response = api_client.post(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['success'] is True
    assert response.data['message'] == "Alert sent"


@pytest.mark.django_db
@patch('products.views.check_low_stock_levels.delay')
def test_low_stock_trigger_alert_failure(mock_task, api_client, admin_user):
    mock_task.side_effect = Exception("Celery down")

    api_client.force_authenticate(user=admin_user)
    url = reverse('products:low-stock-variant-trigger-alert')
    response = api_client.post(url)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.data['success'] is False
    assert "Celery down" in response.data['message']