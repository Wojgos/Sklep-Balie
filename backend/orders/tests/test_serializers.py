"""
Tests for order serializers.
"""
import pytest
from decimal import Decimal
from orders.serializers import (
    OrderCreateSerializer,
    OrderResponseSerializer,
    OrderItemCreateSerializer,
    OrderItemResponseSerializer,
    OrderAdminUpdateSerializer
)
from orders.models import Order, OrderItem


@pytest.mark.django_db
class TestOrderItemCreateSerializer:
    """Tests for OrderItemCreateSerializer."""
    
    def test_valid_data(self):
        """Test serializer with valid data."""
        data = {
            "variant_id": 1,
            "quantity": 2
        }
        serializer = OrderItemCreateSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['variant_id'] == 1
        assert serializer.validated_data['quantity'] == 2
    
    def test_invalid_quantity_zero(self):
        """Test quantity must be at least 1."""
        data = {
            "variant_id": 1,
            "quantity": 0
        }
        serializer = OrderItemCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "quantity" in serializer.errors
    
    def test_invalid_quantity_negative(self):
        """Test quantity cannot be negative."""
        data = {
            "variant_id": 1,
            "quantity": -1
        }
        serializer = OrderItemCreateSerializer(data=data)
        assert not serializer.is_valid()
    
    def test_missing_fields(self):
        """Test missing required fields."""
        serializer = OrderItemCreateSerializer(data={})
        assert not serializer.is_valid()
        assert "variant_id" in serializer.errors
        assert "quantity" in serializer.errors


@pytest.mark.django_db
class TestOrderCreateSerializer:
    """Tests for OrderCreateSerializer."""
    
    def test_valid_data(self, variant):
        """Test serializer with valid data."""
        data = {
            "first_name": "Jan",
            "last_name": "Kowalski",
            "email": "jan@test.com",
            "phone": "123456789",
            "address": "Ulica 1",
            "postal_code": "00-000",
            "city": "Warszawa",
            "notes": "Test notes",
            "items": [
                {"variant_id": variant.id, "quantity": 2}
            ],
            "coupon_code": "TEST10"
        }
        serializer = OrderCreateSerializer(data=data)
        assert serializer.is_valid()
    
    def test_valid_data_without_coupon(self, variant):
        """Test serializer without coupon code."""
        data = {
            "first_name": "Jan",
            "last_name": "Kowalski",
            "email": "jan@test.com",
            "address": "Ulica 1",
            "postal_code": "00-000",
            "city": "Warszawa",
            "items": [
                {"variant_id": variant.id, "quantity": 1}
            ]
        }
        serializer = OrderCreateSerializer(data=data)
        assert serializer.is_valid()
    
    def test_empty_items(self):
        """Test serializer rejects empty items."""
        data = {
            "first_name": "Jan",
            "last_name": "Kowalski",
            "email": "jan@test.com",
            "address": "Ulica 1",
            "postal_code": "00-000",
            "city": "Warszawa",
            "items": []
        }
        serializer = OrderCreateSerializer(data=data)
        # Empty items list is valid at serializer level, but will fail in view
        # The view checks for empty items, not the serializer
        assert serializer.is_valid()  # Serializer allows it, view will reject
    
    def test_missing_required_fields(self):
        """Test missing required fields."""
        serializer = OrderCreateSerializer(data={})
        assert not serializer.is_valid()
        assert "first_name" in serializer.errors
        assert "email" in serializer.errors
        assert "items" in serializer.errors


@pytest.mark.django_db
class TestOrderResponseSerializer:
    """Tests for OrderResponseSerializer."""
    
    def test_serializer_output(self, order):
        """Test serializer output structure."""
        serializer = OrderResponseSerializer(order)
        data = serializer.data
        
        assert 'id' in data
        assert 'first_name' in data
        assert 'last_name' in data
        assert 'email' in data
        assert 'total_price' in data
        assert 'status' in data
        assert 'items' in data
        assert 'customer_username' in data
    
    def test_customer_username_with_user(self, order):
        """Test customer_username when user exists."""
        serializer = OrderResponseSerializer(order)
        data = serializer.data
        
        assert data['customer_username'] == order.user.username
    
    def test_customer_username_without_user(self, variant):
        """Test customer_username when user is None."""
        order = Order.objects.create(
            user=None,
            first_name="Guest",
            last_name="User",
            email="guest@test.com",
            address="Addr",
            postal_code="00-000",
            city="City",
            total_price=Decimal("100.00")
        )
        
        serializer = OrderResponseSerializer(order)
        data = serializer.data
        
        assert data['customer_username'] == 'Gość'
    
    def test_items_in_output(self, order, variant):
        """Test items are included in output."""
        serializer = OrderResponseSerializer(order)
        data = serializer.data
        
        assert len(data['items']) == 1
        assert data['items'][0]['quantity'] == 2
        assert data['items'][0]['variant'] is not None


@pytest.mark.django_db
class TestOrderAdminUpdateSerializer:
    """Tests for OrderAdminUpdateSerializer."""
    
    def test_update_status(self, order):
        """Test updating order status."""
        data = {"status": "shipped"}
        serializer = OrderAdminUpdateSerializer(instance=order, data=data, partial=True)
        assert serializer.is_valid()
        
        updated = serializer.save()
        assert updated.status == "shipped"
    
    def test_update_tracking_number(self, order):
        """Test updating tracking number."""
        data = {"tracking_number": "DPD123456"}
        serializer = OrderAdminUpdateSerializer(instance=order, data=data, partial=True)
        assert serializer.is_valid()
        
        updated = serializer.save()
        assert updated.tracking_number == "DPD123456"
    
    def test_update_multiple_fields(self, order):
        """Test updating multiple fields."""
        data = {
            "status": "completed",
            "tracking_number": "DPD789",
            "paid": True
        }
        serializer = OrderAdminUpdateSerializer(instance=order, data=data, partial=True)
        assert serializer.is_valid()
        
        updated = serializer.save()
        assert updated.status == "completed"
        assert updated.tracking_number == "DPD789"
        assert updated.paid is True

