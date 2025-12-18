"""
Tests for user serializers.
"""
import pytest
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from users.serializers import (
    CustomRegisterSerializer,
    UserProfileSerializer,
    CustomLoginSerializer
)

User = get_user_model()


@pytest.mark.django_db
class TestCustomRegisterSerializer:
    """Tests for CustomRegisterSerializer."""
    
    def test_serializer_valid_data(self):
        """Test serializer with valid data."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "Jan",
            "last_name": "Kowalski"
        }
        serializer = CustomRegisterSerializer(data=data)
        assert serializer.is_valid()
    
    def test_serializer_duplicate_email(self, user):
        """Test serializer rejects duplicate email."""
        from allauth.account.models import EmailAddress
        
        # Create EmailAddress for the user (required for duplicate check)
        EmailAddress.objects.create(
            user=user,
            email=user.email,
            primary=True,
            verified=False
        )
        
        data = {
            "username": "anotheruser",
            "email": user.email,  # Duplicate
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "Jan",
            "last_name": "Kowalski"
        }
        serializer = CustomRegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors
    
    def test_serializer_get_cleaned_data(self):
        """Test get_cleaned_data includes first_name and last_name."""
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "Jan",
            "last_name": "Kowalski"
        }
        serializer = CustomRegisterSerializer(data=data)
        assert serializer.is_valid()
        
        cleaned = serializer.get_cleaned_data()
        assert cleaned['first_name'] == "Jan"
        assert cleaned['last_name'] == "Kowalski"
    
    @pytest.mark.django_db
    def test_serializer_save_sets_names(self):
        """Test save method sets first_name and last_name."""
        from unittest.mock import Mock, patch
        
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "Jan",
            "last_name": "Kowalski"
        }
        serializer = CustomRegisterSerializer(data=data)
        assert serializer.is_valid()
        
        # Test with actual save (simpler than complex mocking)
        request = Mock()
        with patch('users.serializers.RegisterSerializer.save') as mock_super_save:
            mock_user = Mock()
            mock_user.first_name = ""
            mock_user.last_name = ""
            mock_user.save = Mock()
            mock_super_save.return_value = mock_user
            
            user = serializer.save(request)
            
            # Check that names were set
            assert mock_user.first_name == "Jan"
            assert mock_user.last_name == "Kowalski"
            mock_user.save.assert_called()


@pytest.mark.django_db
class TestUserProfileSerializer:
    """Tests for UserProfileSerializer."""
    
    def test_serializer_read_only_fields(self, user):
        """Test all fields are read-only."""
        serializer = UserProfileSerializer(user)
        data = serializer.data
        
        assert data['id'] == user.id
        assert data['username'] == user.username
        assert data['email'] == user.email
        assert data['first_name'] == user.first_name
        assert data['loyalty_points'] == user.loyalty_points
    
    def test_serializer_camel_case_fields(self, user):
        """Test camelCase fields are present."""
        serializer = UserProfileSerializer(user)
        data = serializer.data
        
        assert 'firstName' in data
        assert 'lastName' in data
        assert 'loyaltyPoints' in data
        assert 'isStaff' in data
        assert 'isSuperuser' in data
        assert 'dateJoined' in data
        assert 'isActive' in data
    
    def test_serializer_camel_case_values(self, user):
        """Test camelCase values match snake_case."""
        serializer = UserProfileSerializer(user)
        data = serializer.data
        
        assert data['firstName'] == data['first_name']
        assert data['lastName'] == data['last_name']
        assert data['loyaltyPoints'] == data['loyalty_points']
        assert data['isStaff'] == data['is_staff']


@pytest.mark.django_db
class TestCustomLoginSerializer:
    """Tests for CustomLoginSerializer."""
    
    def test_username_is_none(self):
        """Test username field is removed."""
        serializer = CustomLoginSerializer()
        assert serializer.fields.get('username') is None

