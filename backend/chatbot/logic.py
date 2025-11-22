# backend/chatbot/logic.py
from orders.models import Order
from products.models import Product


class StoreChatbot:

    def get_response(self, message, user):
        msg = message.lower().strip()

        if any(word in msg for word in ['status', 'zamówien', 'paczk', 'przesyłk', 'gdzie jest']):
            return self._handle_order_status(user)

        if any(word in msg for word in ['zwrot', 'reklamacj', 'oddać', 'zwrócić']):
            return ("Na zwrot towaru masz 14 dni. "
                    "Aby zgłosić reklamację, wejdź w zakładkę 'Wsparcie' i utwórz nowe zgłoszenie.")

        if any(word in msg for word in ['szukam', 'cena', 'ile kosztuje', 'macie']):
            return self._handle_product_search(msg)

        if any(word in msg for word in ['kontakt', 'telefon', 'email', 'adres']):
            return ("Nasz dział obsługi klienta pracuje pn-pt 8:00-16:00. "
                    "Tel: +48 123 456 789, E-mail: kontakt@balie.pl")

        if any(word in msg for word in ['cześć', 'hej', 'dzień dobry', 'witaj']):
            return "Cześć! Jestem wirtualnym asystentem. Możesz zapytać mnie o status zamówienia lub ofertę."

        # --- DEFAULT ---
        return ("Przepraszam, nie rozumiem. Możesz zapytać o: status zamówienia, "
                "ofertę produktów lub dane kontaktowe.")

    def _handle_order_status(self, user):
        if not user or not user.is_authenticated:
            return "Aby sprawdzić status swojego zamówienia, musisz się najpierw zalogować."

        last_order = Order.objects.filter(user=user).order_by('-created_at').first()

        if not last_order:
            return "Nie widzę żadnych zamówień na Twoim koncie."

        status_pl = last_order.get_status_display()
        tracking = last_order.tracking_number or "brak numeru śledzenia"
        return f"Twoje ostatnie zamówienie (#{last_order.id}) ma status: '{status_pl}'. Numer przesyłki: {tracking}."

    def _handle_product_search(self, msg):
        keywords = [word for word in msg.split() if len(word) > 3 and word not in ['ile', 'kosztuje', 'szukam']]

        if not keywords:
            return "Mamy szeroką ofertę balii i jacuzzi. Przejdź do katalogu, aby zobaczyć wszystko."

        search_term = keywords[0]
        product = Product.objects.filter(translations__name__icontains=search_term).first()

        if product:
            return f"Mamy w ofercie '{product.name}'. Kliknij w zakładkę Produkty, aby zobaczyć szczegóły."
        else:
            return f"Niestety, nie znalazłem produktu pasującego do hasła '{search_term}'."
