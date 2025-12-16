import pytest
from django.core import mail
from django.core.cache import cache
from products.tasks import check_low_stock_levels
from products.models import ProductVariant


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_check_low_stock_no_variants_below_threshold(product, variant):
    variant.stock = 10
    variant.low_stock_threshold = 5
    variant.save()

    result = check_low_stock_levels()

    assert result == "Stan magazynowy jest w normie."
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_check_low_stock_sends_email_and_sets_cache(product, variant):
    variant.stock = 2
    variant.low_stock_threshold = 5
    variant.sku = "TEST-SKU-123"
    variant.save()

    result = check_low_stock_levels()

    assert "Wysłano alert o niskim stanie" in result
    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert "[PILNE]" in email.subject
    assert "TEST-SKU-123" in email.body
    assert str(variant.stock) in email.body

    cache_key = f"low_stock_alert_sent_{variant.id}"
    assert cache.get(cache_key) is True


@pytest.mark.django_db
def test_check_low_stock_suppressed_by_cache(product, variant):
    variant.stock = 1
    variant.low_stock_threshold = 5
    variant.save()

    cache_key = f"low_stock_alert_sent_{variant.id}"
    cache.set(cache_key, True, 86400)

    result = check_low_stock_levels()

    assert result == "Znaleziono braki, ale alerty zostały już wysłane w ciągu ostatnich 24h."
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_check_low_stock_mixed_variants(product):
    v1 = ProductVariant.objects.create(
        product=product, sku="V1", price=10, stock=1, low_stock_threshold=5
    )
    cache.set(f"low_stock_alert_sent_{v1.id}", True, 86400)

    v2 = ProductVariant.objects.create(
        product=product, sku="V2", price=10, stock=1, low_stock_threshold=5
    )

    result = check_low_stock_levels()

    assert len(mail.outbox) == 1
    email_body = mail.outbox[0].body

    assert "V1" in email_body
    assert "V2" in email_body

    assert cache.get(f"low_stock_alert_sent_{v2.id}") is True