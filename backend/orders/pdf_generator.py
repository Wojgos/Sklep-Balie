import logging
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

try:
    from weasyprint import HTML
except OSError as exc:
    HTML = None
    WEASYPRINT_IMPORT_ERROR = exc
    logger.warning(
        "WeasyPrint nie jest w pełni zainstalowany. Generowanie PDF będzie niedostępne: %s",
        exc
    )


def generate_invoice_pdf(order):
    """
    Renderuje szablon HTML faktury do pliku PDF za pomocą WeasyPrint.
    """

    if HTML is None:
        raise RuntimeError(
            "Generowanie PDF jest niedostępne na tej maszynie, ponieważ WeasyPrint "
            "nie może załadować bibliotek systemowych (GTK/LibGObject). "
            "Zainstaluj zależności opisane w dokumentacji WeasyPrint lub uruchom tę funkcję "
            "na środowisku, w którym są dostępne."
        ) from WEASYPRINT_IMPORT_ERROR

    seller_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Drzewna 123",
        "zip_city": "00-001 Warszawa",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    context = {
        'order': order,
        'seller': seller_data,
    }

    html_string = render_to_string('orders/invoice.html', context)

    base_url = settings.STATIC_URL or '/'

    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file


def generate_statistics_pdf(statistics_data):
    """
    Renderuje raport statystyk sprzedażowych do pliku PDF za pomocą WeasyPrint.
    
    Args:
        statistics_data (dict): Słownik zawierający:
            - period: dict z 'start_date' i 'end_date'
            - summary: dict z 'total_revenue', 'total_orders', 'average_order_value'
            - top_products: lista produktów z 'product', 'quantity', 'revenue'
            - revenue_by_category: lista kategorii z 'category', 'revenue'
            - orders_by_status: lista statusów z 'status', 'count'
            - by_day: lista danych dziennych (opcjonalnie)
    """
    
    if HTML is None:
        raise RuntimeError(
            "Generowanie PDF jest niedostępne na tej maszynie, ponieważ WeasyPrint "
            "nie może załadować bibliotek systemowych (GTK/LibGObject). "
            "Zainstaluj zależności opisane w dokumentacji WeasyPrint lub uruchom tę funkcję "
            "na środowisku, w którym są dostępne."
        ) from WEASYPRINT_IMPORT_ERROR

    company_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Wiejska 45",
        "zip_city": "00-001 Bialystok",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    context = {
        'statistics': statistics_data,
        'company': company_data,
    }

    html_string = render_to_string('orders/statistics_report.html', context)

    base_url = settings.STATIC_URL or '/'

    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file
