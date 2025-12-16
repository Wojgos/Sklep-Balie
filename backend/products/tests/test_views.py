import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
def test_get_product_list(api_client, product, variant):
    url = reverse('products:product-list')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 1
    assert response.data['results'][0]['name'] == product.name

@pytest.mark.django_db
def test_get_product_detail(api_client, product, variant):
    url = reverse('products:product-detail', kwargs={'slug': product.slug})
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['name'] == product.name
    assert len(response.data['variants']) == 1
    assert response.data['variants'][0]['price'] == '100.00'

@pytest.mark.django_db
def test_get_product_not_found(api_client):
    url = reverse('products:product-detail', kwargs={'slug': 'non-existent'})
    response = api_client.get(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_filter_products_by_category(api_client, category, product):
    url = reverse('products:product-list') + f'?category={category.id}'
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 1

@pytest.mark.django_db
def test_product_list_serializer_structure(api_client, product, variant):
    url = reverse('products:product-search')
    response = api_client.get(url, {'q': 'Test'})
    assert response.status_code == status.HTTP_200_OK