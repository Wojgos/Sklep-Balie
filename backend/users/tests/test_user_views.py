import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="StrongPassword123!",
        loyalty_points=150
    )


@pytest.mark.django_db
def test_custom_register_view_success(api_client):
    try:
        url = reverse('users:register')
    except:
        try:
            url = reverse('rest_register')
        except:
            url = '/api/v1/users/registration/'

    data = {
        "username": "newuser123",
        "email": "new.user@example.com",
        "first_name": "Jan",
        "last_name": "Kowalski",
        "password": "StrongPassword!987",
        "password1": "StrongPassword!987",
        "password2": "StrongPassword!987"
    }

    with patch('users.views.transaction.on_commit') as mock_commit, \
            patch('users.views.send_registration_confirmation_email_task.delay') as mock_task:

        mock_commit.side_effect = lambda func: func()

        response = api_client.post(url, data)

    assert response.status_code == status.HTTP_201_CREATED, f"Błąd rejestracji: {response.data}"

    assert "Konto zostało pomyśtnie utworzone" in response.data['detail']

    assert User.objects.filter(email="new.user@example.com").exists()
    created_user = User.objects.get(email="new.user@example.com")

    mock_task.assert_called_once_with(created_user.id)


@pytest.mark.django_db
def test_custom_register_view_invalid_data(api_client):
    try:
        url = reverse('users:register')
    except:
        try:
            url = reverse('rest_register')
        except:
            url = '/api/v1/users/registration/'

    data = {
        "username": "",
        "email": "invalid-email",
        "password": "123"
    }

    response = api_client.post(url, data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert User.objects.filter(email="invalid-email").exists() is False


@pytest.mark.django_db
def test_user_profile_view_authenticated(api_client, user):
    try:
        url = reverse('users:user-profile')
    except:
        url = '/api/v1/users/profile/'

    api_client.force_authenticate(user=user)
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['email'] == "test@example.com"
    assert response.data['username'] == "testuser"


@pytest.mark.django_db
def test_user_profile_view_unauthenticated(api_client):
    try:
        url = reverse('users:user-profile')
    except:
        url = '/api/v1/users/profile/'

    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_user_loyalty_points_view_authenticated(api_client, user):
    try:
        url = reverse('users:loyalty-points')
    except:
        url = '/api/v1/users/loyalty-points/'

    api_client.force_authenticate(user=user)
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['available_points'] == 150
    assert response.data['user_id'] == user.id


@pytest.mark.django_db
def test_user_loyalty_points_view_unauthenticated(api_client):
    try:
        url = reverse('users:loyalty-points')
    except:
        url = '/api/v1/users/loyalty-points/'

    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED