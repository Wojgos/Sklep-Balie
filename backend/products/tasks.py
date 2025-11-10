# products/tasks.py
from celery import shared_task
from django.db.models import F
from django.conf import settings
from django.core.mail import send_mail
from .models import ProductVariant


@shared_task
def check_low_stock_levels():
    """
    Sprawdza wszystkie warianty produktów i wyszukuje te,
    których stan magazynowy jest PONIŻEJ ich progu alarmowego.
    """
    # F() pozwala na porównanie dwóch pól w bazie danych
    # Znajdź warianty, gdzie: stock < low_stock_threshold
    low_stock_variants = ProductVariant.objects.filter(
        stock__lt=F('low_stock_threshold')
    )

    if not low_stock_variants.exists():
        return "Stan magazynowy jest w normie."

    # Przygotuj e-mail do admina
    subject = "[PILNE] Niski stan magazynowy w sklepie Balie Ogrodowe"
    message_lines = [
        "Następujące produkty osiągnęły niski stan magazynowy i wymagają zamówienia:\n"
    ]

    for variant in low_stock_variants:
        message_lines.append(
            f"- SKU: {variant.sku} (Produkt: {variant.product.name})"
            f" | Stan: {variant.stock} szt."
            f" | Próg: {variant.low_stock_threshold} szt."
        )

    # Wyślij JEDEN zbiorczy e-mail (wypisze się w konsoli Celery)
    send_mail(
        subject,
        "\n".join(message_lines),
        settings.DEFAULT_FROM_EMAIL,
        [settings.ADMIN_EMAIL]  # Musimy zdefiniować ten e-mail
    )

    return f"Wysłano alert o niskim stanie dla {low_stock_variants.count()} wariantów."