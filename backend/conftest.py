"""
Shared pytest fixtures for all tests.
"""
import pytest
import os
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

# Configure test database to use SQLite (no credentials needed)
os.environ.setdefault('USE_TEST_DB', 'True')

from products.models import Category, Product, ProductVariant, ProductAttribute, AttributeValue
from promotions.models import DiscountCoupon, LoyaltyReward
from orders.models import Order, OrderItem

User = get_user_model()


# ========== CLIENT FIXTURES ==========

@pytest.fixture
def api_client():
    """APIClient for making API requests."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def user(django_user_model):
    """Regular user for testing."""
    return django_user_model.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        loyalty_points=100
    )


@pytest.fixture
def admin_user(django_user_model):
    """Admin user for testing."""
    return django_user_model.objects.create_user(
        username="admin",
        email="admin@example.com",
        password="adminpass123",
        is_staff=True,
        is_superuser=True
    )


# ========== PRODUCT FIXTURES ==========

@pytest.fixture
def category():
    """Category with translations."""
    cat = Category.objects.create(slug="test-category")
    cat.set_current_language('pl')
    cat.name = "Testowa Kategoria"
    cat.description = "Opis kategorii"
    cat.save()
    
    cat.set_current_language('en')
    cat.name = "Test Category"
    cat.description = "Category description"
    cat.save()
    
    return cat


@pytest.fixture
def product(category):
    """Product with translations."""
    prod = Product.objects.create(category=category, available=True)
    prod.set_current_language('pl')
    prod.name = "Testowy Produkt"
    prod.slug = "testowy-produkt"  # Slug based on name
    prod.description = "Opis produktu"
    prod.save()
    
    prod.set_current_language('en')
    prod.name = "Test Product"
    prod.slug = "test-product"  # Different slug for English
    prod.description = "Product description"
    prod.save()
    
    return prod


@pytest.fixture
def variant(product):
    """Product variant with translations."""
    var = ProductVariant.objects.create(
        product=product,
        sku="TEST-SKU-001",
        price=Decimal("100.00"),
        stock=50,
        low_stock_threshold=10,
        available=True
    )
    var.set_current_language('pl')
    var.name = "Testowy Wariant"
    var.save()
    
    var.set_current_language('en')
    var.name = "Test Variant"
    var.save()
    
    return var


@pytest.fixture
def product_attribute():
    """Product attribute with translations."""
    attr = ProductAttribute.objects.create()
    attr.set_current_language('pl')
    attr.name = "Kolor"
    attr.save()
    
    attr.set_current_language('en')
    attr.name = "Color"
    attr.save()
    
    return attr


@pytest.fixture
def attribute_value(product_attribute):
    """Attribute value with translations."""
    val = AttributeValue.objects.create(attribute=product_attribute)
    val.set_current_language('pl')
    val.value = "Czerwony"
    val.save()
    
    val.set_current_language('en')
    val.value = "Red"
    val.save()
    
    return val


# ========== PROMOTION FIXTURES ==========

@pytest.fixture
def loyalty_reward():
    """Loyalty reward with translations."""
    reward = LoyaltyReward.objects.create(
        points_required=50,
        reward_value=Decimal("10.00"),
        is_percentage=False,
        active=True
    )
    reward.set_current_language('pl')
    reward.name = "Testowa Nagroda"
    reward.description = "Opis nagrody"
    reward.save()
    
    reward.set_current_language('en')
    reward.name = "Test Reward"
    reward.description = "Reward description"
    reward.save()
    
    return reward


@pytest.fixture
def discount_coupon():
    """Valid discount coupon."""
    return DiscountCoupon.objects.create(
        code="TEST10",
        value=Decimal("10.00"),
        is_percentage=False,
        active=True,
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=30),
        usage_limit=10,
        usage_count=0
    )


@pytest.fixture
def percentage_coupon():
    """Percentage discount coupon."""
    return DiscountCoupon.objects.create(
        code="PERC20",
        value=Decimal("20.00"),
        is_percentage=True,
        active=True,
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=30),
        usage_limit=5,
        usage_count=0
    )


# ========== ORDER FIXTURES ==========

@pytest.fixture
def order(user, variant):
    """Order with items."""
    order = Order.objects.create(
        user=user,
        first_name="Jan",
        last_name="Kowalski",
        email="jan@test.com",
        address="Ulica 1",
        postal_code="00-000",
        city="Warszawa",
        total_price=Decimal("200.00"),
        paid=True,
        status="processing"
    )
    OrderItem.objects.create(
        order=order,
        variant=variant,
        product_name=str(variant),
        price=Decimal("100.00"),
        quantity=2
    )
    return order


# ========== SUPPORT FIXTURES ==========

@pytest.fixture
def ticket(user):
    """Support ticket."""
    from support.models import Ticket
    return Ticket.objects.create(
        user=user,
        subject="Test Subject",
        status=Ticket.STATUS_NEW
    )

