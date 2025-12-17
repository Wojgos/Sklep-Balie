"""
Tests for support views.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from support.models import Ticket, TicketMessage


@pytest.mark.django_db
class TestClientTicketViewSet:
    """Tests for client ticket views."""
    
    def test_create_ticket(self, api_client, user):
        """Test creating a ticket."""
        api_client.force_authenticate(user=user)
        
        url = reverse('support:client-ticket-list')
        data = {
            "subject": "Test Subject",
            "body": "Test message body"
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Ticket.objects.count() == 1
        assert TicketMessage.objects.count() == 1
        
        ticket = Ticket.objects.first()
        assert ticket.user == user
        assert ticket.subject == "Test Subject"
        assert ticket.messages.count() == 1
        assert ticket.messages.first().body == "Test message body"
    
    def test_list_own_tickets(self, api_client, user):
        """Test listing own tickets."""
        ticket1 = Ticket.objects.create(user=user, subject="Ticket 1")
        ticket2 = Ticket.objects.create(user=user, subject="Ticket 2")
        
        # Create ticket for another user
        other_user = user.__class__.objects.create_user(
            username="other", email="other@test.com", password="pass"
        )
        Ticket.objects.create(user=other_user, subject="Other Ticket")
        
        api_client.force_authenticate(user=user)
        url = reverse('support:client-ticket-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
    
    def test_retrieve_own_ticket(self, api_client, user):
        """Test retrieving own ticket."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        TicketMessage.objects.create(ticket=ticket, author=user, body="Message")
        
        api_client.force_authenticate(user=user)
        url = reverse('support:client-ticket-detail', kwargs={'pk': ticket.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['subject'] == "Test"
        assert len(response.data['messages']) == 1
    
    def test_cannot_retrieve_other_ticket(self, api_client, user):
        """Test cannot retrieve other user's ticket."""
        other_user = user.__class__.objects.create_user(
            username="other", email="other@test.com", password="pass"
        )
        ticket = Ticket.objects.create(user=other_user, subject="Other")
        
        api_client.force_authenticate(user=user)
        url = reverse('support:client-ticket-detail', kwargs={'pk': ticket.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_reply_to_ticket(self, api_client, user):
        """Test replying to ticket."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        
        api_client.force_authenticate(user=user)
        url = reverse('support:client-ticket-reply', kwargs={'pk': ticket.id})
        data = {"body": "Reply message"}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert TicketMessage.objects.count() == 1
        assert ticket.messages.first().body == "Reply message"
        ticket.refresh_from_db()
        assert ticket.status == Ticket.STATUS_NEW
    
    def test_cannot_update_ticket(self, api_client, user):
        """Test client cannot update ticket."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        
        api_client.force_authenticate(user=user)
        url = reverse('support:client-ticket-detail', kwargs={'pk': ticket.id})
        data = {"subject": "Updated"}
        
        response = api_client.put(url, data)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_cannot_delete_ticket(self, api_client, user):
        """Test client cannot delete ticket."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        
        api_client.force_authenticate(user=user)
        url = reverse('support:client-ticket-detail', kwargs={'pk': ticket.id})
        
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_unauthenticated_access(self, api_client):
        """Test unauthenticated access is denied."""
        url = reverse('support:client-ticket-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAdminTicketViewSet:
    """Tests for admin ticket views."""
    
    def test_admin_list_all_tickets(self, api_client, admin_user, user):
        """Test admin can list all tickets."""
        Ticket.objects.create(user=user, subject="User Ticket")
        other_user = user.__class__.objects.create_user(
            username="other", email="other@test.com", password="pass"
        )
        Ticket.objects.create(user=other_user, subject="Other Ticket")
        
        api_client.force_authenticate(user=admin_user)
        url = reverse('support:admin-ticket-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
    
    def test_admin_filter_by_status(self, api_client, admin_user, user):
        """Test admin can filter tickets by status."""
        Ticket.objects.create(user=user, subject="New", status=Ticket.STATUS_NEW)
        Ticket.objects.create(user=user, subject="Closed", status=Ticket.STATUS_CLOSED)
        
        api_client.force_authenticate(user=admin_user)
        url = reverse('support:admin-ticket-list')
        response = api_client.get(url, {'status': Ticket.STATUS_NEW})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == Ticket.STATUS_NEW
    
    def test_admin_update_status(self, api_client, admin_user, user):
        """Test admin can update ticket status."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        
        api_client.force_authenticate(user=admin_user)
        url = reverse('support:admin-ticket-detail', kwargs={'pk': ticket.id})
        data = {"status": Ticket.STATUS_IN_PROGRESS}
        
        response = api_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        ticket.refresh_from_db()
        assert ticket.status == Ticket.STATUS_IN_PROGRESS
    
    def test_admin_reply_to_ticket(self, api_client, admin_user, user):
        """Test admin can reply to ticket."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        
        api_client.force_authenticate(user=admin_user)
        url = reverse('support:admin-ticket-reply', kwargs={'pk': ticket.id})
        data = {"body": "Admin reply"}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert TicketMessage.objects.count() == 1
        ticket.refresh_from_db()
        assert ticket.status == Ticket.STATUS_IN_PROGRESS
    
    def test_admin_cannot_create_ticket(self, api_client, admin_user):
        """Test admin cannot create ticket via admin endpoint."""
        api_client.force_authenticate(user=admin_user)
        url = reverse('support:admin-ticket-list')
        data = {"subject": "Test", "body": "Body"}
        
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_non_admin_cannot_access(self, api_client, user):
        """Test non-admin cannot access admin endpoint."""
        api_client.force_authenticate(user=user)
        url = reverse('support:admin-ticket-list')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

