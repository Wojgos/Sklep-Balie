import pytest
from unittest.mock import patch, MagicMock
from django.core import mail
from orders.tasks import send_invoice_email_task
from orders.models import Order


@pytest.mark.django_db
def test_send_invoice_email_success():
    with patch('orders.tasks.Order.objects.get') as mock_get, \
            patch('orders.tasks.generate_invoice_pdf') as mock_pdf:
        mock_order = MagicMock()
        mock_order.id = 123
        mock_order.first_name = "Jan"
        mock_order.email = "jan@test.pl"
        mock_get.return_value = mock_order

        mock_pdf.return_value = b"fake_pdf_content"

        result = send_invoice_email_task(123)

        assert result == "Wysłano e-mail dla zamówienia 123"
        assert len(mail.outbox) == 1
        assert mail.outbox[0].subject == "Potwierdzenie zamówienia nr 123 - Balie Ogrodowe"
        assert mail.outbox[0].to == ["jan@test.pl"]

        mock_pdf.assert_called_once_with(mock_order)


@pytest.mark.django_db
def test_send_invoice_email_order_not_found():
    with patch('orders.tasks.Order.objects.get') as mock_get:
        mock_get.side_effect = Order.DoesNotExist

        result = send_invoice_email_task(999)

        assert "nie zostało znalezione" in result
        assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_send_invoice_email_general_error():
    with patch('orders.tasks.Order.objects.get') as mock_get, \
            patch('orders.tasks.generate_invoice_pdf') as mock_pdf:
        mock_order = MagicMock()
        mock_order.id = 123
        mock_get.return_value = mock_order

        mock_pdf.side_effect = Exception("Critical PDF Error")

        result = send_invoice_email_task(123)

        assert "Błąd podczas wysyłania" in result
        assert "Critical PDF Error" in result
        assert len(mail.outbox) == 0