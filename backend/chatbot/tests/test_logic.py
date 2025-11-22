# backend/chatbot/tests/test_logic.py
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
    # 1. SETUP
    user = User.objects.create_user(username='botuser', password='pw', email='b@b.com')

    # Tworzymy zamówienie dla tego usera
    Order.objects.create(
        user=user,
        total_price=100,
        status='shipped',  # Status: Wysłane
        tracking_number='DPD123'
    )

    bot = StoreChatbot()

    # 2. AKCJA
    # Pytamy o "paczkę"
    response = bot.get_response("Gdzie jest moja paczka?", user)

    # 3. WERYFIKACJA
    # Odpowiedź powinna zawierać status i numer śledzenia
    assert "Wysłane" in response
    assert "DPD123" in response


def test_chatbot_unknown_message():
    """Sprawdza fallback dla nieznanej wiadomości."""
    bot = StoreChatbot()
    response = bot.get_response("Bla bla bla", None)
    assert "Przepraszam, nie rozumiem" in response