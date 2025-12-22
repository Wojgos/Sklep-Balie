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

    base_url = settings.STATIC_URL or '/'

    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file


def generate_monthly_statistics_pdf(monthly_data):
    """
    Generuje raport PDF dla statystyk miesięcznych.
    
    Args:
        monthly_data (dict): Dane miesięczne zawierające:
            - summary: podsumowanie (total_revenue, total_orders, etc.)
            - monthly_data: lista miesięcy z danymi
            - best_month: najlepszy miesiąc
            - worst_month: najsłabszy miesiąc
    """
    if HTML is None:
        raise RuntimeError(
            "Generowanie PDF jest niedostępne na tej maszynie, ponieważ WeasyPrint "
            "nie może załadować bibliotek systemowych (GTK/LibGObject)."
        ) from WEASYPRINT_IMPORT_ERROR

    from django.utils import timezone

    company_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Wiejska 45",
        "zip_city": "00-001 Białystok",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    context = {
        'data': monthly_data,
        'company': company_data,
        'report_type': 'Miesięczny',
        'now': timezone.now(),
    }

    html_string = render_to_string('orders/monthly_report.html', context)
    base_url = settings.STATIC_URL or '/'
    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file


def generate_yearly_statistics_pdf(yearly_data):
    """
    Generuje raport PDF dla statystyk rocznych.
    
    Args:
        yearly_data (dict): Dane roczne zawierające:
            - summary: podsumowanie
            - yearly_data: lista lat z danymi
            - best_year: najlepszy rok
            - worst_year: najsłabszy rok
    """
    if HTML is None:
        raise RuntimeError(
            "Generowanie PDF jest niedostępne na tej maszynie, ponieważ WeasyPrint "
            "nie może załadować bibliotek systemowych (GTK/LibGObject)."
        ) from WEASYPRINT_IMPORT_ERROR

    from django.utils import timezone

    company_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Wiejska 45",
        "zip_city": "00-001 Białystok",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    context = {
        'data': yearly_data,
        'company': company_data,
        'report_type': 'Roczny',
        'now': timezone.now(),
    }

    html_string = render_to_string('orders/yearly_report.html', context)
    base_url = settings.STATIC_URL or '/'
    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file


def generate_category_performance_pdf(category_data):
    """
    Generuje raport PDF dla wydajności kategorii.
    
    Args:
        category_data (dict): Dane kategorii zawierające:
            - period: zakres dat
            - summary: podsumowanie
            - categories: lista kategorii z danymi
    """
    if HTML is None:
        raise RuntimeError(
            "Generowanie PDF jest niedostępne na tej maszynie, ponieważ WeasyPrint "
            "nie może załadować bibliotek systemowych (GTK/LibGObject)."
        ) from WEASYPRINT_IMPORT_ERROR

    from django.utils import timezone

    company_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Wiejska 45",
        "zip_city": "00-001 Białystok",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    context = {
        'data': category_data,
        'company': company_data,
        'report_type': 'Wydajność Kategorii',
        'now': timezone.now(),
    }

    html_string = render_to_string('orders/category_report.html', context)
    base_url = settings.STATIC_URL or '/'
    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file


def generate_top_products_pdf(products_data):
    """
    Generuje raport PDF dla top produktów.
    
    Args:
        products_data (dict): Dane produktów zawierające:
            - period: zakres dat
            - top_products: lista najlepszych produktów
    """
    if HTML is None:
        raise RuntimeError(
            "Generowanie PDF jest niedostępne na tej maszynie, ponieważ WeasyPrint "
            "nie może załadować bibliotek systemowych (GTK/LibGObject)."
        ) from WEASYPRINT_IMPORT_ERROR

    from django.utils import timezone

    # Oblicz sumy
    total_revenue = sum(p.get('revenue', 0) for p in products_data.get('top_products', []))
    total_quantity = sum(p.get('quantity_sold', 0) for p in products_data.get('top_products', []))

    company_data = {
        "name": "Balie Ogrodowe Premium Sp. z o.o.",
        "address": "ul. Wiejska 45",
        "zip_city": "00-001 Białystok",
        "nip": "123-456-78-90",
        "email": "kontakt@baliepremium.pl"
    }

    # Dodaj sumy do danych
    products_data['totals'] = {
        'total_revenue': total_revenue,
        'total_quantity': total_quantity
    }

    context = {
        'data': products_data,
        'company': company_data,
        'report_type': 'Top Produkty',
        'now': timezone.now(),
    }

    html_string = render_to_string('orders/top_products_report.html', context)
    base_url = settings.STATIC_URL or '/'
    pdf_file = HTML(string=html_string, base_url=base_url).write_pdf()

    return pdf_file
