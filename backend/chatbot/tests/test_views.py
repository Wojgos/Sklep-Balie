"""
Tests for chatbot views.
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestChatbotView:
    """Tests for ChatbotView."""
    
    def test_post_valid_message(self, api_client):
        """Test posting valid message."""
        url = '/api/v1/chatbot/ask/'
        data = {"message": "Cześć"}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert "response" in response.data
        assert len(response.data['response']) > 0
    
    def test_post_empty_message(self, api_client):
        """Test posting empty message."""
        url = '/api/v1/chatbot/ask/'
        data = {"message": ""}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
    
    def test_post_missing_message(self, api_client):
        """Test posting without message field."""
        url = '/api/v1/chatbot/ask/'
        data = {}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_unauthenticated_access(self, api_client):
        """Test unauthenticated users can access."""
        url = '/api/v1/chatbot/ask/'
        data = {"message": "Hello"}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_authenticated_access(self, api_client, user):
        """Test authenticated users can access."""
        api_client.force_authenticate(user=user)
        url = '/api/v1/chatbot/ask/'
        data = {"message": "Status zamówienia"}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK

