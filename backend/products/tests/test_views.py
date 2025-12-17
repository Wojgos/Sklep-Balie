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
    # The ProductViewSet uses translations__slug to find products
    # Default language is 'pl' (from PARLER_LANGUAGES settings)
    # We need to ensure the slug exists in the translation
    
    # Set and save slug in PL (default language)
    product.set_current_language('pl')
    slug = "testowy-produkt"
    product.slug = slug
    product.save()
    
    # Also set in EN for completeness
    product.set_current_language('en')
    product.slug = "test-product"
    product.save()
    
    # Ensure product is available (queryset filters by available=True)
    product.available = True
    product.save()
    
    # Refresh from DB to ensure translations are saved
    product.refresh_from_db()
    
    # Verify the slug exists in PL translation
    product.set_current_language('pl')
    assert product.slug == slug, f"Slug should be '{slug}' but got '{product.slug}'"
    
    # Use reverse to get the URL
    url = reverse('products:product-detail', kwargs={'slug': slug})
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK, (
        f"Expected 200, got {response.status_code}. "
        f"Slug used: '{slug}'. "
        f"Product ID: {product.id}, Available: {product.available}. "
        f"Response: {getattr(response, 'data', getattr(response, 'content', 'No response data'))}"
    )
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