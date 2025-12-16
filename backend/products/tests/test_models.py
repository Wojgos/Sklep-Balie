import pytest
from products.models import (
    Category,
    ProductAttribute,
    AttributeValue,
    ProductImage
)

@pytest.mark.django_db
def test_create_category():
    category = Category.objects.create(slug="cat-test")
    category.set_current_language('pl')
    category.name = "Test"
    category.save()
    assert category.pk is not None

@pytest.mark.django_db
def test_create_product_attribute():
    attr = ProductAttribute.objects.create()
    attr.set_current_language('pl')
    attr.name = "Color"
    attr.save()
    assert attr.pk is not None

@pytest.mark.django_db
def test_create_attribute_value():
    attr = ProductAttribute.objects.create()
    val = AttributeValue.objects.create(attribute=attr)
    val.set_current_language('pl')
    val.value = "Red"
    val.save()
    assert val.pk is not None

@pytest.mark.django_db
def test_create_product_image():
    image = ProductImage.objects.create(image="test.jpg")
    assert image.pk is not None