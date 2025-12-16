import pytest
from products.documents import ProductDocument
from products.models import AttributeValue, ProductAttribute


@pytest.mark.django_db
def test_prepare_name_pl(product):
    doc = ProductDocument()

    product.set_current_language('pl')
    product.name = "Balia Ogrodowa"
    product.save()

    prepared_name = doc.prepare_name_pl(product)

    assert prepared_name == "Balia Ogrodowa"


@pytest.mark.django_db
def test_prepare_description_pl(product):
    doc = ProductDocument()

    product.set_current_language('pl')
    product.description = "To jest opis testowy."
    product.save()

    prepared_desc = doc.prepare_description_pl(product)

    assert prepared_desc == "To jest opis testowy."


@pytest.mark.django_db
def test_prepare_category(product, category):
    doc = ProductDocument()

    category.set_current_language('pl')
    category.name = "Testowa Kategoria"
    category.save()

    prepared_category = doc.prepare_category(product)

    assert prepared_category == "Testowa Kategoria"


@pytest.mark.django_db
def test_prepare_attributes_flat(product, variant):
    attr = ProductAttribute.objects.create(name="Kolor")
    val_red = AttributeValue.objects.create(attribute=attr, value="Czerwony")

    val_red.set_current_language('pl')
    val_red.value = "Czerwony"
    val_red.save()

    variant.attributes.add(val_red)

    doc = ProductDocument()
    flat_attrs = doc.prepare_attributes_flat(product)

    assert "Czerwony" in flat_attrs