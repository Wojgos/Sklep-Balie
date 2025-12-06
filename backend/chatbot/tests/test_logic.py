import pytest
from django.contrib.auth import get_user_model
from orders.models import Order
from chatbot.logic import StoreChatbot

User = get_user_model()


@pytest.mark.django_db
def test_chatbot_returns_order_status_for_logged_user():
    """
    Sprawdza, czy bot poprawnie odczytuje status zamówienia z bazy.
    """
    user = User.objects.create_user(username='botuser', password='pw', email='b@b.com')

    Order.objects.create(
        user=user,
        total_price=100,
        status='shipped',
        tracking_number='DPD123'
    )

    bot = StoreChatbot()

    response = bot.get_response("Gdzie jest moja paczka?", user)

    assert "Wysłane" in response
    assert "DPD123" in response


def test_chatbot_unknown_message():
    """Sprawdza fallback dla nieznanej wiadomości."""
    bot = StoreChatbot()
    response = bot.get_response("Bla bla bla", None)
    assert "Przepraszam, nie rozumiem" in response
