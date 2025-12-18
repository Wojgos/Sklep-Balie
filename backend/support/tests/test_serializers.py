"""
Tests for support serializers.
"""
import pytest
from support.serializers import (
    TicketCreateSerializer,
    TicketListSerializer,
    TicketDetailSerializer,
    TicketReplySerializer,
    TicketAdminUpdateSerializer,
    TicketMessageSerializer
)
from support.models import Ticket, TicketMessage


@pytest.mark.django_db
class TestTicketCreateSerializer:
    """Tests for TicketCreateSerializer."""
    
    def test_valid_data(self):
        """Test serializer with valid data."""
        data = {
            "subject": "Test Subject",
            "body": "Test message body"
        }
        serializer = TicketCreateSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['subject'] == "Test Subject"
        assert serializer.validated_data['body'] == "Test message body"
    
    def test_missing_fields(self):
        """Test missing required fields."""
        serializer = TicketCreateSerializer(data={})
        assert not serializer.is_valid()
        assert "subject" in serializer.errors
        assert "body" in serializer.errors


@pytest.mark.django_db
class TestTicketListSerializer:
    """Tests for TicketListSerializer."""
    
    def test_serializer_output(self, user):
        """Test serializer output structure."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        TicketMessage.objects.create(ticket=ticket, author=user, body="Message")
        
        serializer = TicketListSerializer(ticket)
        data = serializer.data
        
        assert 'id' in data
        assert 'subject' in data
        assert 'status' in data
        assert 'created_at' in data
        assert 'user' in data
        assert 'message_count' in data
        assert data['message_count'] == 1


@pytest.mark.django_db
class TestTicketDetailSerializer:
    """Tests for TicketDetailSerializer."""
    
    def test_serializer_output(self, user):
        """Test serializer output structure."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        TicketMessage.objects.create(ticket=ticket, author=user, body="Message 1")
        TicketMessage.objects.create(ticket=ticket, author=user, body="Message 2")
        
        serializer = TicketDetailSerializer(ticket)
        data = serializer.data
        
        assert 'id' in data
        assert 'subject' in data
        assert 'messages' in data
        assert 'participants' in data
        assert len(data['messages']) == 2
    
    def test_participants_includes_all_authors(self, user):
        """Test participants includes all message authors."""
        admin_user = user.__class__.objects.create_user(
            username="admin", email="admin@test.com", password="pass", is_staff=True
        )
        
        ticket = Ticket.objects.create(user=user, subject="Test")
        TicketMessage.objects.create(ticket=ticket, author=user, body="User message")
        TicketMessage.objects.create(ticket=ticket, author=admin_user, body="Admin message")
        
        serializer = TicketDetailSerializer(ticket)
        data = serializer.data
        
        assert len(data['participants']) == 2
        participant_ids = [p['id'] for p in data['participants']]
        assert user.id in participant_ids
        assert admin_user.id in participant_ids


@pytest.mark.django_db
class TestTicketReplySerializer:
    """Tests for TicketReplySerializer."""
    
    def test_valid_data(self):
        """Test serializer with valid data."""
        data = {"body": "Reply message"}
        serializer = TicketReplySerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['body'] == "Reply message"
    
    def test_empty_body(self):
        """Test empty body is invalid."""
        serializer = TicketReplySerializer(data={"body": ""})
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestTicketAdminUpdateSerializer:
    """Tests for TicketAdminUpdateSerializer."""
    
    def test_update_status(self, user):
        """Test updating ticket status."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        
        data = {"status": Ticket.STATUS_IN_PROGRESS}
        serializer = TicketAdminUpdateSerializer(instance=ticket, data=data, partial=True)
        assert serializer.is_valid()
        
        updated = serializer.save()
        assert updated.status == Ticket.STATUS_IN_PROGRESS


@pytest.mark.django_db
class TestTicketMessageSerializer:
    """Tests for TicketMessageSerializer."""
    
    def test_serializer_output(self, user):
        """Test serializer output structure."""
        ticket = Ticket.objects.create(user=user, subject="Test")
        message = TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            body="Test message"
        )
        
        serializer = TicketMessageSerializer(message)
        data = serializer.data
        
        assert 'id' in data
        assert 'author_id' in data
        assert 'body' in data
        assert 'created_at' in data
        assert data['author_id'] == user.id

