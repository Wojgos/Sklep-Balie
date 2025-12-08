# backend/chatbot/logic.py
from orders.models import Order
from products.models import Product


class StoreChatbot:
    """
    Wielojęzyczny chatbot e-commerce.
    """

    # Słownik słów kluczowych i odpowiedzi
    CONFIG = {
        'pl': {
            'keywords': {
                'status': ['status', 'zamówien', 'paczk', 'przesyłk', 'gdzie jest'],
                'returns': ['zwrot', 'reklamacj', 'oddać', 'zwrócić'],
                'products': ['szukam', 'cena', 'ile kosztuje', 'macie'],
                'contact': ['kontakt', 'telefon', 'email', 'adres'],
                'hello': ['cześć', 'hej', 'dzień dobry', 'witaj'],
            },
            'responses': {
                'login_required': "Aby sprawdzić status swojego zamówienia, musisz się najpierw zalogować.",
                'no_orders': "Nie widzę żadnych zamówień na Twoim koncie.",
                'order_status': "Twoje ostatnie zamówienie (#{id}) ma status: '{status}'. Numer przesyłki: {tracking}.",
                'returns': "Na zwrot towaru masz 14 dni. Aby zgłosić reklamację, wejdź w zakładkę 'Wsparcie'.",
                'contact': "Nasz dział obsługi klienta pracuje pn-pt 8:00-16:00. Tel: +48 123 456 789.",
                'hello': "Cześć! Jestem wirtualnym asystentem. Możesz zapytać mnie o status zamówienia lub ofertę.",
                'product_found': "Mamy w ofercie '{name}'. Kliknij w zakładkę Produkty, aby zobaczyć szczegóły.",
                'product_not_found': "Niestety, nie znalazłem produktu pasującego do hasła '{term}'.",
                'offer_general': "Mamy szeroką ofertę balii i jacuzzi. Przejdź do katalogu, aby zobaczyć wszystko.",
                'default': "Przepraszam, nie rozumiem. Możesz zapytać o: status zamówienia, ofertę lub kontakt."
            }
        },
        'en': {
            'keywords': {
                'status': ['status', 'order', 'package', 'tracking', 'where is'],
                'returns': ['return', 'complaint', 'refund', 'broken'],
                'products': ['looking for', 'price', 'cost', 'have you', 'search'],
                'contact': ['contact', 'phone', 'email', 'address'],
                'hello': ['hi', 'hello', 'hey', 'good morning'],
            },
            'responses': {
                'login_required': "You must be logged in to check your order status.",
                'no_orders': "I don't see any orders on your account.",
                'order_status': "Your last order (#{id}) status is: '{status}'. Tracking number: {tracking}.",
                'returns': "You have 14 days to return the product. To file a complaint, go to the 'Support' tab.",
                'contact': "Customer support is open Mon-Fri 8:00-16:00. Phone: +48 123 456 789.",
                'hello': "Hi! I am a virtual assistant. You can ask me about order status or our offer.",
                'product_found': "We have '{name}' in our offer. Check the Products tab for details.",
                'product_not_found': "Unfortunately, I couldn't find a product matching '{term}'.",
                'offer_general': "We have a wide range of hot tubs. Go to the catalog to see everything.",
                'default': "I'm sorry, I don't understand. You can ask about: order status, products, or contact info."
            }
        }
    }

    def get_response(self, message, user, language='pl'):
        """Główna metoda przetwarzająca wiadomość."""
        lang_config = self.CONFIG.get(language, self.CONFIG['pl'])
        keywords = lang_config['keywords']
        responses = lang_config['responses']

        msg = message.lower().strip()

        # 1. STATUS ZAMÓWIENIA
        if any(word in msg for word in keywords['status']):
            return self._handle_order_status(user, responses)

        # 2. ZWROTY
        if any(word in msg for word in keywords['returns']):
            return responses['returns']

        # 3. PRODUKTY
        if any(word in msg for word in keywords['products']):
            return self._handle_product_search(msg, responses, language)

        # 4. KONTAKT
        if any(word in msg for word in keywords['contact']):
            return responses['contact']

        # 5. POWITANIE
        if any(word in msg for word in keywords['hello']):
            return responses['hello']

        # DEFAULT
        return responses['default']

    def _handle_order_status(self, user, responses):
        if not user or not user.is_authenticated:
            return responses['login_required']

        last_order = Order.objects.filter(user=user).order_by('-created_at').first()

        if not last_order:
            return responses['no_orders']

        # Status jest tłumaczony automatycznie przez Django, jeśli w modelu użyto choices z gettext
        # Ale tutaj dla uproszczenia zwrócimy surowy, lub musielibyśmy użyć translate
        status_display = last_order.get_status_display()
        tracking = last_order.tracking_number or "-"

        return responses['order_status'].format(id=last_order.id, status=status_display, tracking=tracking)

    def _handle_product_search(self, msg, responses, language):
        # Prosta heurystyka wyciągania słowa kluczowego
        ignored = ['ile', 'kosztuje', 'szukam', 'price', 'cost', 'search', 'looking', 'for']
        keywords = [word for word in msg.split() if len(word) > 3 and word not in ignored]

        if not keywords:
            return responses['offer_general']

        search_term = keywords[0]

        # Szukamy w tłumaczeniach (django-parler)
        # Używamy translation__name__icontains
        product = Product.objects.language(language).filter(translations__name__icontains=search_term).first()

        if product:
            return responses['product_found'].format(name=product.name)
        else:
            return responses['product_not_found'].format(term=search_term)
