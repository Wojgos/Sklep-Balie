# products/tasks.py
from celery import shared_task
from django.db.models import F
from django.conf import settings
from django.core.mail import send_mail
from django.core.cache import cache
from .models import ProductVariant

ALERT_COOLDOWN = 86400

@shared_task
def check_low_stock_levels():
    """
    Sprawdza wszystkie warianty produktów i wyszukuje te,
    których stan magazynowy jest PONIŻEJ ich progu alarmowego.
    """
    low_stock_variants = ProductVariant.objects.filter(
        stock__lt=F('low_stock_threshold')
    )

    if not low_stock_variants.exists():
        return "Stan magazynowy jest w normie."

    variants_to_alert = []

    for variant in low_stock_variants:
        cache_key = f"low_stock_alert_sent_{variant.id}"

        if cache.get(cache_key):
            continue

        variants_to_alert.append(variant)

    if not variants_to_alert:
        return "Znaleziono braki, ale alerty zostały już wysłane w ciągu ostatnich 24h."

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

        cache_key = f"low_stock_alert_sent_{variant.id}"
        cache.set(cache_key, True, ALERT_COOLDOWN)

    send_mail(
        subject,
        "\n".join(message_lines),
        settings.DEFAULT_FROM_EMAIL,
        [settings.ADMIN_EMAIL]
    )

    return f"Wysłano alert o niskim stanie dla {low_stock_variants.count()} wariantów."