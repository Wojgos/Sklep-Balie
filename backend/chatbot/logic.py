# backend/chatbot/logic.py
from orders.models import Order
from products.models import Product
from django.db.models import Q


class StoreChatbot:
    """
    Wielojęzyczny chatbot e-commerce (Rozszerzony).
    """

    # Słownik słów kluczowych i odpowiedzi
    CONFIG = {
        'pl': {
            'keywords': {
                'status': ['status', 'zamówien', 'paczk', 'przesyłk', 'gdzie jest'],
                'returns': ['zwrot', 'reklamacj', 'oddać', 'zwrócić', 'gwarancj'],
                'products': ['szukam', 'cena', 'ile kosztuje', 'macie', 'oferta'],
                'contact': ['kontakt', 'telefon', 'email', 'adres', 'siedziba'],
                'hello': ['cześć', 'hej', 'dzień dobry', 'witaj'],
                'delivery': ['dostaw', 'wysyłk', 'transport', 'czas', 'ile się czeka', 'kurier'],
                'payment': ['płatnośc', 'płatności', 'raty', 'leasing', 'faktur', 'kart', 'przelew'],
                'loyalty': ['punkt', 'lojaln', 'nagrod', 'program', 'bonus'],
                'technical': ['wod', 'filtr', 'czyszcz', 'piec', 'nagrzew', 'prąd', 'drewn'],
            },
            'responses': {
                'login_required': "Aby sprawdzić status swojego zamówienia, musisz się najpierw zalogować.",
                'no_orders': "Nie widzę żadnych zamówień na Twoim koncie.",
                'order_status': "Twoje ostatnie zamówienie (#{id}) ma status: '{status}'. Numer przesyłki: {tracking}.",
                'returns': "Na zwrot towaru masz 14 dni. Gwarancja wynosi 24 miesiące. Aby zgłosić reklamację, wejdź w zakładkę 'Wsparcie'.",
                'contact': "Nasz dział obsługi klienta pracuje pn-pt 8:00-16:00. Tel: +48 123 456 789.",
                'hello': "Cześć! Jestem wirtualnym asystentem. Możesz zapytać mnie o status zamówienia, dostawę, raty lub kwestie techniczne.",
                'product_found': "Mamy w ofercie '{name}'. Kliknij w zakładkę Produkty, aby zobaczyć szczegóły.",
                'product_not_found': "Niestety, nie znalazłem produktu pasującego do hasła '{term}'.",
                'offer_general': "Mamy szeroką ofertę balii i jacuzzi. Przejdź do katalogu, aby zobaczyć wszystko.",
                'delivery': "Realizacja zamówienia trwa zazwyczaj 2-4 tygodnie. Oferujemy transport na terenie całej Polski. Koszt wyliczany jest w koszyku.",
                'payment': "Akceptujemy szybkie płatności online, karty oraz przelewy tradycyjne. Oferujemy również zakupy na raty 0% oraz leasing dla firm.",
                'loyalty': "Za każde wydane 10 zł otrzymujesz 1 punkt. Uzbierane punkty możesz wymieniać na kupony rabatowe w zakładce 'Moje Konto' -> 'Program Lojalnościowy'.",
                'technical': "Balia nagrzewa się w ok. 2-3h (drewno) lub 4-6h (elektrycznie). Zalecamy wymianę wody co 2 miesiące i stosowanie filtrów dostępnych w naszym sklepie.",

                'default': "Przepraszam, nie rozumiem. Spróbuj zapytać inaczej (np. 'kiedy dostawa?', 'czy są raty?', 'jak dbać o wodę?')."
            }
        },
        'en': {
            'keywords': {
                'status': ['status', 'order', 'package', 'tracking', 'where is'],
                'returns': ['return', 'complaint', 'refund', 'broken', 'warranty'],
                'products': ['looking for', 'price', 'cost', 'have you', 'search', 'offer'],
                'contact': ['contact', 'phone', 'email', 'address'],
                'hello': ['hi', 'hello', 'hey', 'good morning'],
                'delivery': ['delivery', 'ship', 'transport', 'time', 'how long', 'arrive'],
                'payment': ['pay', 'card', 'invoice', 'installment', 'leasing'],
                'loyalty': ['point', 'loyal', 'reward', 'program', 'bonus'],
                'technical': ['water', 'filter', 'clean', 'heat', 'stove', 'electric', 'wood'],
            },
            'responses': {
                'login_required': "You must be logged in to check your order status.",
                'no_orders': "I don't see any orders on your account.",
                'order_status': "Your last order (#{id}) status is: '{status}'. Tracking number: {tracking}.",
                'returns': "You have 14 days to return the product. Warranty is 24 months. To file a complaint, go to the 'Support' tab.",
                'contact': "Customer support is open Mon-Fri 8:00-16:00. Phone: +48 123 456 789.",
                'hello': "Hi! I am a virtual assistant. Ask me about delivery, payments, or technical details.",
                'product_found': "We have '{name}' in our offer. Check the Products tab for details.",
                'product_not_found': "Unfortunately, I couldn't find a product matching '{term}'.",
                'offer_general': "We have a wide range of hot tubs. Go to the catalog to see everything.",

                # NEW RESPONSES
                'delivery': "Delivery usually takes 2-4 weeks. We ship across the EU. Shipping costs are calculated at checkout.",
                'payment': "We accept credit cards and online transfers. Installment plans are available for selected countries.",
                'loyalty': "You get 1 point for every 10 PLN spent. You can redeem points for discount coupons in 'My Account' -> 'Loyalty Program'.",
                'technical': "Heating takes approx 2-3h (wood) or 4-6h (electric). We recommend changing water every 2 months and using filters available in our store.",

                'default': "I'm sorry, I don't understand. Try asking: 'shipping time?', 'payment methods?', 'how to clean?'."
            }
        }
    }

    def get_response(self, message, user, language='pl'):
        """Główna metoda przetwarzająca wiadomość."""
        # Pobieramy konfigurację dla danego języka (domyślnie PL)
        lang_config = self.CONFIG.get(language, self.CONFIG['pl'])
        keywords = lang_config['keywords']
        responses = lang_config['responses']

        msg = message.lower().strip()

        # --- LOGIKA SPRAWDZANIA SŁÓW KLUCZOWYCH ---

        # 1. STATUS ZAMÓWIENIA
        if any(word in msg for word in keywords['status']):
            return self._handle_order_status(user, responses)

        # 2. DOSTAWA (Nowe)
        if any(word in msg for word in keywords['delivery']):
            return responses['delivery']

        # 3. PŁATNOŚCI (Nowe)
        if any(word in msg for word in keywords['payment']):
            return responses['payment']

        # 4. LOJALNOŚĆ (Nowe)
        if any(word in msg for word in keywords['loyalty']):
            return responses['loyalty']

        # 5. TECHNICZNE (Nowe)
        if any(word in msg for word in keywords['technical']):
            return responses['technical']

        # 6. ZWROTY
        if any(word in msg for word in keywords['returns']):
            return responses['returns']

        # 7. KONTAKT
        if any(word in msg for word in keywords['contact']):
            return responses['contact']

        # 8. PRODUKTY (Wyszukiwanie)
        # To dajemy na końcu, żeby słowa typu "cena" nie nadpisały innych intencji
        if any(word in msg for word in keywords['products']):
            return self._handle_product_search(msg, responses, language)

        # 9. POWITANIE
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

        status_display = last_order.get_status_display()
        tracking = last_order.tracking_number or "-"

        return responses['order_status'].format(id=last_order.id, status=status_display, tracking=tracking)

    def _handle_product_search(self, msg, responses, language):
        ignored = ['ile', 'kosztuje', 'szukam', 'price', 'cost', 'search', 'looking', 'for', 'macie', 'oferta', 'have',
                   'you']
        keywords = [word for word in msg.split() if len(word) > 3 and word not in ignored]

        if not keywords:
            return responses['offer_general']

        search_term = keywords[0]

        # Wyszukiwanie w bazie (uwzględnia i18n dzięki django-parler)
        try:
            # Używamy translation__name__icontains, aby szukać w przetłumaczonych nazwach
            product = Product.objects.filter(translations__name__icontains=search_term).first()

            if product:
                # Pobieramy nazwę w aktualnym języku
                product.set_current_language(language)
                return responses['product_found'].format(name=product.name)
        except Exception:
            pass

        return responses['product_not_found'].format(term=search_term)