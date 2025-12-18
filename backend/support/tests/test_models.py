"""
Tests for support models.
"""
import pytest
from support.models import Ticket, TicketMessage


@pytest.mark.django_db
class TestTicket:
    """Tests for Ticket model."""
    
    def test_ticket_creation(self, user):
        """Test creating a ticket."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test Subject",
            status=Ticket.STATUS_NEW
        )
        
        assert ticket.user == user
        assert ticket.subject == "Test Subject"
        assert ticket.status == Ticket.STATUS_NEW
    
    def test_ticket_default_status(self, user):
        """Test default status is NEW."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test"
        )
        
        assert ticket.status == Ticket.STATUS_NEW
    
    def test_ticket_str_representation(self, user):
        """Test string representation."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test Subject"
        )
        
        str_repr = str(ticket)
        assert "Zgłoszenie" in str_repr
        assert str(ticket.id) in str_repr
        assert "Test Subject" in str_repr
    
    def test_ticket_ordering(self, user):
        """Test tickets are ordered by updated_at descending."""
        ticket1 = Ticket.objects.create(
            user=user,
            subject="First"
        )
        
        ticket2 = Ticket.objects.create(
            user=user,
            subject="Second"
        )
        
        tickets = list(Ticket.objects.all())
        assert tickets[0] == ticket2  # Most recent first
        assert tickets[1] == ticket1
    
    def test_ticket_status_choices(self, user):
        """Test all status choices."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test"
        )
        
        ticket.status = Ticket.STATUS_IN_PROGRESS
        ticket.save()
        assert ticket.status == Ticket.STATUS_IN_PROGRESS
        
        ticket.status = Ticket.STATUS_CLOSED
        ticket.save()
        assert ticket.status == Ticket.STATUS_CLOSED


@pytest.mark.django_db
class TestTicketMessage:
    """Tests for TicketMessage model."""
    
    def test_message_creation(self, user):
        """Test creating a message."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test"
        )
        
        message = TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            body="Test message body"
        )
        
        assert message.ticket == ticket
        assert message.author == user
        assert message.body == "Test message body"
    
    def test_message_str_representation(self, user):
        """Test string representation."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test"
        )
        
        message = TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            body="Test body"
        )
        
        str_repr = str(message)
        assert user.username in str_repr
        assert str(ticket.id) in str_repr
    
    def test_message_ordering(self, user):
        """Test messages are ordered by created_at ascending."""
        ticket = Ticket.objects.create(
            user=user,
            subject="Test"
        )
        
        message1 = TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            body="First"
        )
        
        message2 = TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            body="Second"
        )
        
        messages = list(ticket.messages.all())
        assert messages[0] == message1
        assert messages[1] == message2

