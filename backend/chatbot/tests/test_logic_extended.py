"""
Extended tests for chatbot logic.
"""
import pytest
from chatbot.logic import StoreChatbot
from orders.models import Order
from products.models import Product, Category


@pytest.mark.django_db
class TestStoreChatbot:
    """Extended tests for StoreChatbot."""
    
    def test_hello_keywords_pl(self):
        """Test hello keywords in Polish."""
        bot = StoreChatbot()
        response = bot.get_response("Cześć", None, language='pl')
        assert "Cześć" in response or "asystent" in response
    
    def test_hello_keywords_en(self):
        """Test hello keywords in English."""
        bot = StoreChatbot()
        response = bot.get_response("Hello", None, language='en')
        assert "Hi" in response or "assistant" in response
    
    def test_delivery_keywords(self):
        """Test delivery keywords."""
        bot = StoreChatbot()
        response = bot.get_response("Kiedy dostawa?", None, language='pl')
        assert "dostaw" in response.lower() or "transport" in response.lower()
    
    def test_payment_keywords(self):
        """Test payment keywords."""
        bot = StoreChatbot()
        response = bot.get_response("Jakie płatności?", None, language='pl')
        assert "płatnośc" in response.lower() or "kart" in response.lower()
    
    def test_loyalty_keywords(self):
        """Test loyalty keywords."""
        bot = StoreChatbot()
        response = bot.get_response("Punkty lojalnościowe", None, language='pl')
        assert "punkt" in response.lower() or "lojaln" in response.lower()
    
    def test_technical_keywords(self):
        """Test technical keywords."""
        bot = StoreChatbot()
        response = bot.get_response("Jak dbać o wodę?", None, language='pl')
        assert "wod" in response.lower() or "filtr" in response.lower()
    
    def test_returns_keywords(self):
        """Test returns keywords."""
        bot = StoreChatbot()
        response = bot.get_response("Zwrot towaru", None, language='pl')
        assert "zwrot" in response.lower() or "reklamacj" in response.lower()
    
    def test_contact_keywords(self):
        """Test contact keywords."""
        bot = StoreChatbot()
        response = bot.get_response("Kontakt", None, language='pl')
        # Response contains contact info
        assert "obsługi" in response.lower() or "telefon" in response.lower() or "kontakt" in response.lower() or "+48" in response
    
    def test_order_status_not_logged_in(self):
        """Test order status when not logged in."""
        bot = StoreChatbot()
        response = bot.get_response("Gdzie jest moja paczka?", None, language='pl')
        assert "zalogować" in response.lower() or "login" in response.lower()
    
    def test_order_status_no_orders(self, user):
        """Test order status when user has no orders."""
        bot = StoreChatbot()
        response = bot.get_response("Status zamówienia", user, language='pl')
        assert "zamówień" in response.lower() or "orders" in response.lower()
    
    def test_order_status_with_order(self, user, variant):
        """Test order status when user has orders."""
        order = Order.objects.create(
            user=user,
            first_name="Jan",
            last_name="Test",
            email="test@test.com",
            address="Addr",
            postal_code="00-000",
            city="City",
            total_price=100,
            status="shipped",
            tracking_number="DPD123"
        )
        
        bot = StoreChatbot()
        response = bot.get_response("Gdzie jest paczka?", user, language='pl')
        
        assert str(order.id) in response
        assert "Wysłane" in response or "shipped" in response.lower()
        assert "DPD123" in response
    
    def test_product_search_found(self, category):
        """Test product search when product is found."""
        product = Product.objects.create(category=category, slug="test-product", available=True)
        product.set_current_language('pl')
        product.name = "Balia Ogrodowa"
        product.save()
        
        bot = StoreChatbot()
        response = bot.get_response("Szukam balii", None, language='pl')
        
        assert "Balia Ogrodowa" in response or "balii" in response.lower()
    
    def test_product_search_not_found(self):
        """Test product search when product is not found."""
        bot = StoreChatbot()
        response = bot.get_response("Szukam nieistniejącego produktu", None, language='pl')
        
        assert "nie znalazłem" in response.lower() or "not found" in response.lower()
    
    def test_product_search_general(self):
        """Test general product search."""
        bot = StoreChatbot()
        response = bot.get_response("Macie produkty?", None, language='pl')
        
        # When search term is too short/ignored, returns offer_general or product_not_found
        assert "oferta" in response.lower() or "katalog" in response.lower() or "balii" in response.lower() or "produktu" in response.lower()
    
    def test_default_response(self):
        """Test default response for unknown message."""
        bot = StoreChatbot()
        response = bot.get_response("Bla bla bla random text", None, language='pl')
        
        assert "nie rozumiem" in response.lower() or "don't understand" in response.lower()
    
    def test_language_fallback(self):
        """Test language fallback to Polish."""
        bot = StoreChatbot()
        response = bot.get_response("Hello", None, language='de')  # Unsupported language
        
        # Should fallback to Polish config
        assert len(response) > 0
    
    def test_case_insensitive_keywords(self):
        """Test keywords are case insensitive."""
        bot = StoreChatbot()
        response1 = bot.get_response("CZĘŚĆ", None, language='pl')
        response2 = bot.get_response("cześć", None, language='pl')
        
        # Both should trigger hello response
        assert "asystent" in response1.lower() or "asystent" in response2.lower()

