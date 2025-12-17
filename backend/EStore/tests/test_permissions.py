"""
Tests for custom permissions.
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from EStore.permissions import IsAdminUser, IsAdminUserOrReadOnly, IsOrderOwnerOrAdmin
from orders.models import Order
from decimal import Decimal


@pytest.mark.django_db
class TestIsAdminUser:
    """Tests for IsAdminUser permission."""
    
    def test_admin_user_has_permission(self, admin_user):
        """Test admin user has permission."""
        permission = IsAdminUser()
        request = type('Request', (), {'user': admin_user})()
        assert permission.has_permission(request, None) is True
    
    def test_regular_user_no_permission(self, user):
        """Test regular user has no permission."""
        permission = IsAdminUser()
        request = type('Request', (), {'user': user})()
        assert permission.has_permission(request, None) is False
    
    def test_anonymous_user_no_permission(self):
        """Test anonymous user has no permission."""
        permission = IsAdminUser()
        request = type('Request', (), {'user': None})()
        assert permission.has_permission(request, None) is False


@pytest.mark.django_db
class TestIsAdminUserOrReadOnly:
    """Tests for IsAdminUserOrReadOnly permission."""
    
    def test_safe_method_allows_anonymous(self):
        """Test safe methods (GET) allow anonymous users."""
        permission = IsAdminUserOrReadOnly()
        request = type('Request', (), {'user': None, 'method': 'GET'})()
        assert permission.has_permission(request, None) is True
    
    def test_safe_method_allows_regular_user(self, user):
        """Test safe methods (GET) allow regular users."""
        permission = IsAdminUserOrReadOnly()
        request = type('Request', (), {'user': user, 'method': 'GET'})()
        assert permission.has_permission(request, None) is True
    
    def test_unsafe_method_allows_admin(self, admin_user):
        """Test unsafe methods (POST) allow admin users."""
        permission = IsAdminUserOrReadOnly()
        request = type('Request', (), {'user': admin_user, 'method': 'POST'})()
        assert permission.has_permission(request, None) is True
    
    def test_unsafe_method_denies_regular_user(self, user):
        """Test unsafe methods (POST) deny regular users."""
        permission = IsAdminUserOrReadOnly()
        request = type('Request', (), {'user': user, 'method': 'POST'})()
        assert permission.has_permission(request, None) is False
    
    def test_unsafe_method_denies_anonymous(self):
        """Test unsafe methods (POST) deny anonymous users."""
        permission = IsAdminUserOrReadOnly()
        request = type('Request', (), {'user': None, 'method': 'POST'})()
        assert permission.has_permission(request, None) is False


@pytest.mark.django_db
class TestIsOrderOwnerOrAdmin:
    """Tests for IsOrderOwnerOrAdmin permission."""
    
    def test_admin_has_permission(self, admin_user, order):
        """Test admin has permission for any order."""
        permission = IsOrderOwnerOrAdmin()
        request = type('Request', (), {'user': admin_user})()
        assert permission.has_object_permission(request, None, order) is True
    
    def test_owner_has_permission(self, user, variant):
        """Test order owner has permission."""
        order = Order.objects.create(
            user=user,
            first_name="Test",
            email="test@test.com",
            address="Addr",
            postal_code="00-000",
            city="City",
            total_price=Decimal("100.00")
        )
        permission = IsOrderOwnerOrAdmin()
        request = type('Request', (), {'user': user})()
        assert permission.has_object_permission(request, None, order) is True
    
    def test_non_owner_no_permission(self, user, variant):
        """Test non-owner has no permission."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_user = User.objects.create_user(
            username="other",
            email="other@test.com",
            password="pass"
        )
        order = Order.objects.create(
            user=user,
            first_name="Test",
            email="test@test.com",
            address="Addr",
            postal_code="00-000",
            city="City",
            total_price=Decimal("100.00")
        )
        permission = IsOrderOwnerOrAdmin()
        request = type('Request', (), {'user': other_user})()
        assert permission.has_object_permission(request, None, order) is False

