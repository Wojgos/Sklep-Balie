# orders/pdf_generator.py
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML


def generate_invoice_pdf(order):
    """
    Renderuje szablon HTML faktury do pliku PDF za pomocą WeasyPrint.
    """

    # Dane sprzedawcy (można je przenieść do settings.py)
    seller_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Drzewna 123",
        "zip_city": "00-001 Warszawa",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    # Przygotuj kontekst dla szablonu
    context = {
        'order': order,
        'seller': seller_data,
    }

    # Renderuj HTML do stringa
    # Używamy ścieżki, którą stworzyliśmy: 'orders/invoice.html'
    html_string = render_to_string('orders/invoice.html', context)

    # Opcjonalnie: jeśli masz pliki CSS/obrazy statyczne, musisz
    # podać Django 'base_url', aby WeasyPrint mógł je znaleźć
    base_url = settings.STATIC_URL or '/'  # Działa dla trybu DEBUG

    # Generuj PDF
    # .write_pdf() zwraca dane binarne PDF (bytes)
    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file
