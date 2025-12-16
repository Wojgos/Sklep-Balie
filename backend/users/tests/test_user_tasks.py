import pytest
from unittest.mock import patch, MagicMock
from users.tasks import send_registration_confirmation_email_task
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

User = get_user_model()

@pytest.mark.django_db
def test_send_registration_email_success():
    with patch('users.tasks.User.objects.get') as mock_user_get, \
         patch('users.tasks.EmailAddress.objects.get') as mock_email_get:

        mock_user = MagicMock()
        mock_user.email = "test@test.com"
        mock_user.id = 1
        mock_user_get.return_value = mock_user

        mock_email_address = MagicMock()
        mock_email_get.return_value = mock_email_address

        result = send_registration_confirmation_email_task(1)

        assert "Wysłano e-mail weryfikacyjny do test@test.com" in result
        mock_email_address.send_confirmation.assert_called_once_with(request=None, signup=True)

@pytest.mark.django_db
def test_send_registration_email_user_not_found():
    with patch('users.tasks.User.objects.get') as mock_user_get:
        mock_user_get.side_effect = User.DoesNotExist

        result = send_registration_confirmation_email_task(999)

        assert "Błąd zadania: Użytkownik o ID 999 nie został znaleziony" in result

@pytest.mark.django_db
def test_send_registration_email_address_not_found():
    with patch('users.tasks.User.objects.get') as mock_user_get, \
         patch('users.tasks.EmailAddress.objects.get') as mock_email_get:

        mock_user = MagicMock()
        mock_user.id = 1
        mock_user_get.return_value = mock_user

        mock_email_get.side_effect = EmailAddress.DoesNotExist

        result = send_registration_confirmation_email_task(1)

        assert "Błąd zadania: Nie znaleziono obiektu EmailAddress" in result

@pytest.mark.django_db
def test_send_registration_email_generic_error():
    with patch('users.tasks.User.objects.get') as mock_user_get, \
         patch('users.tasks.EmailAddress.objects.get') as mock_email_get:

        mock_user = MagicMock()
        mock_user.id = 1
        mock_user_get.return_value = mock_user

        mock_email_address = MagicMock()
        mock_email_address.send_confirmation.side_effect = Exception("SMTP Error")
        mock_email_get.return_value = mock_email_address

        result = send_registration_confirmation_email_task(1)

        assert "Błąd zadania dla 1: SMTP Error" in result