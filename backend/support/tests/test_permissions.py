"""
Tests for support permissions.
"""
import pytest
from support.permissions import IsTicketOwnerOrAdmin
from support.models import Ticket


@pytest.mark.django_db
class TestIsTicketOwnerOrAdmin:
    """Tests for IsTicketOwnerOrAdmin permission."""
    
    def test_admin_has_permission(self, admin_user, ticket):
        """Test admin has permission for any ticket."""
        permission = IsTicketOwnerOrAdmin()
        request = type('Request', (), {'user': admin_user})()
        assert permission.has_object_permission(request, None, ticket) is True
    
    def test_owner_has_permission(self, user):
        """Test ticket owner has permission."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test Subject",
            status=Ticket.STATUS_NEW
        )
        permission = IsTicketOwnerOrAdmin()
        request = type('Request', (), {'user': user})()
        assert permission.has_object_permission(request, None, ticket) is True
    
    def test_non_owner_no_permission(self, user):
        """Test non-owner has no permission."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_user = User.objects.create_user(
            username="other",
            email="other@test.com",
            password="pass"
        )
        ticket = Ticket.objects.create(
            user=user,
            subject="Test Subject",
            status=Ticket.STATUS_NEW
        )
        permission = IsTicketOwnerOrAdmin()
        request = type('Request', (), {'user': other_user})()
        assert permission.has_object_permission(request, None, ticket) is False

