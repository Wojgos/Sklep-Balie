import pytest
from rest_framework.test import APIClient
from products.models import Category, Product, ProductVariant


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def category():
    return Category.objects.create(name="Test Category", slug="test-category")


@pytest.fixture
def product(category):
    return Product.objects.create(
        category=category,
        name="Test Product",
        slug="test-product",
        description="Test description",
        available=True
    )


@pytest.fixture
def variant(product):
    return ProductVariant.objects.create(
        product=product,
        name="Test Variant",
        sku="TEST-SKU-1",
        price=100.00,
        stock=10,
        available=True
    )
