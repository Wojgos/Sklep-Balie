import pytest
import io
from PIL import Image
from rest_framework.test import APIRequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from products.serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductVariantSerializer,
    ProductAttributeSerializer,
    AttributeValueSerializer,
    ProductImageSerializer
)
from products.models import (
    Category,
    Product,
    ProductVariant,
    ProductAttribute,
    AttributeValue,
    ProductImage
)


@pytest.fixture
def context():
    factory = APIRequestFactory()
    request = factory.get('/')
    return {'request': request}


@pytest.fixture
def category():
    return Category.objects.create(name="Test Category", slug="test-cat")


@pytest.fixture
def product(category):
    return Product.objects.create(
        category=category,
        name="Test Product",
        slug="test-product"
    )


@pytest.fixture
def attribute():
    return ProductAttribute.objects.create(name="Color")


@pytest.fixture
def attribute_value(attribute):
    return AttributeValue.objects.create(attribute=attribute, value="Red")


@pytest.mark.django_db
def test_category_serializer_create():
    data = {
        'name': 'New Category',
        'description': 'Description'
    }
    serializer = CategorySerializer(data=data)
    assert serializer.is_valid()
    category = serializer.save()
    assert category.name == 'New Category'
    assert category.slug is not None


@pytest.mark.django_db
def test_category_serializer_update(category):
    data = {'name': 'Updated Name'}
    serializer = CategorySerializer(instance=category, data=data, partial=True)
    assert serializer.is_valid()
    updated = serializer.save()
    assert updated.name == 'Updated Name'


@pytest.mark.django_db
def test_attribute_serializer_create():
    data = {'name': 'Size'}
    serializer = ProductAttributeSerializer(data=data)
    assert serializer.is_valid()
    attr = serializer.save()
    assert attr.name == 'Size'


@pytest.mark.django_db
def test_attribute_value_serializer_create(attribute):
    data = {'attribute': attribute.id, 'value': 'XL'}
    serializer = AttributeValueSerializer(data=data)
    assert serializer.is_valid()
    val = serializer.save()
    assert val.value == 'XL'
    assert val.attribute == attribute


@pytest.mark.django_db
def test_variant_serializer_create_with_attributes(product, attribute_value):
    data = {
        'product': product.id,
        'sku': 'SKU-TEST',
        'price': 100.00,
        'stock': 10,
        'attribute_values': [attribute_value.id],
        'name': 'Var 1'
    }
    serializer = ProductVariantSerializer(data=data)
    assert serializer.is_valid()
    variant = serializer.save()
    assert variant.attributes.count() == 1
    assert variant.attributes.first() == attribute_value


@pytest.mark.django_db
def test_variant_serializer_update(product):
    variant = ProductVariant.objects.create(product=product, sku="OLD", price=50, stock=5)
    data = {'price': 150.00, 'name': 'New Name'}
    serializer = ProductVariantSerializer(instance=variant, data=data, partial=True)
    assert serializer.is_valid()
    updated = serializer.save()
    assert updated.price == 150.00
    assert updated.name == 'New Name'


@pytest.mark.django_db
def test_product_serializer_create_simple(category):
    data = {
        'name': 'Simple Product',
        'category_write': category.id,
        'description': 'Desc'
    }
    serializer = ProductSerializer(data=data)
    assert serializer.is_valid()
    prod = serializer.save()
    assert prod.name == 'Simple Product'
    assert prod.variants.count() == 0


@pytest.mark.django_db
def test_product_serializer_create_full_with_variant_and_image(category):
    data = {
        'name': 'Full Product',
        'category_write': category.id,
        'price': 99.99,
        'stock': 100,
        'image': 'http://example.com/image.jpg'
    }
    serializer = ProductSerializer(data=data)
    assert serializer.is_valid()
    prod = serializer.save()

    assert prod.variants.count() == 1
    variant = prod.variants.first()
    assert float(variant.price) == 99.99
    assert variant.stock == 100

    img = ProductImage.objects.filter(product=prod).first()
    assert img is not None
    assert str(img.image) == 'http://example.com/image.jpg'
    assert img.is_main is True


@pytest.mark.django_db
def test_product_serializer_update_creates_variant_if_missing(product):
    assert product.variants.count() == 0
    data = {'price': 200.00, 'stock': 5}
    serializer = ProductSerializer(instance=product, data=data, partial=True)
    assert serializer.is_valid()
    serializer.save()

    assert product.variants.count() == 1
    assert float(product.variants.first().price) == 200.00


@pytest.mark.django_db
def test_product_serializer_update_existing_variant(product):
    ProductVariant.objects.create(product=product, sku="ABC", price=100, stock=10)
    data = {'price': 300.00}
    serializer = ProductSerializer(instance=product, data=data, partial=True)
    assert serializer.is_valid()
    serializer.save()

    assert float(product.variants.first().price) == 300.00


@pytest.mark.django_db
def test_product_serializer_update_image_existing(product):
    variant = ProductVariant.objects.create(product=product, sku="ABC", price=100, stock=10)
    ProductImage.objects.create(product=product, variant=variant, image="old.jpg", is_main=True)

    data = {'image': 'new.jpg'}
    serializer = ProductSerializer(instance=product, data=data, partial=True)
    assert serializer.is_valid()
    serializer.save()

    img = ProductImage.objects.get(product=product, is_main=True)
    assert str(img.image) == 'new.jpg'


@pytest.mark.django_db
def test_product_serializer_update_image_new(product):
    ProductVariant.objects.create(product=product, sku="ABC", price=100, stock=10)
    assert ProductImage.objects.count() == 0

    data = {'image': 'created.jpg'}
    serializer = ProductSerializer(instance=product, data=data, partial=True)
    assert serializer.is_valid()
    serializer.save()

    img = ProductImage.objects.first()
    assert str(img.image) == 'created.jpg'
    assert img.is_main is True


@pytest.mark.django_db
def test_get_available_attributes(product, attribute):
    val1 = AttributeValue.objects.create(attribute=attribute, value="Blue")
    val2 = AttributeValue.objects.create(attribute=attribute, value="Green")

    v1 = ProductVariant.objects.create(product=product, sku="V1", available=True, price=100, stock=10)
    v1.attributes.add(val1)

    v2 = ProductVariant.objects.create(product=product, sku="V2", available=True, price=100, stock=10)
    v2.attributes.add(val2)

    serializer = ProductSerializer(product)
    attrs = serializer.data['available_attributes']

    assert 'Color' in attrs
    assert 'Blue' in attrs['Color']
    assert 'Green' in attrs['Color']


@pytest.mark.django_db
def test_to_representation_images(product, context):
    serializer = ProductSerializer(product, context=context)
    assert 'placeholder.jpg' in serializer.data['image']

    variant = ProductVariant.objects.create(product=product, sku="V1", price=100, stock=10)
    variant_img = ProductImage.objects.create(product=product, variant=variant, image="variant_img.jpg", is_main=True)

    serializer = ProductSerializer(product, context=context)
    assert 'variant_img.jpg' in serializer.data['image']

    variant_img.is_main = False
    variant_img.save()

    ProductImage.objects.create(product=product, image="product_main.jpg", is_main=True)
    serializer = ProductSerializer(product, context=context)
    assert 'product_main.jpg' in serializer.data['image']


@pytest.mark.django_db
def test_product_image_serializer_create(product):
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), 'white')
    image.save(file, 'JPEG')
    file.seek(0)
    image_file = SimpleUploadedFile("test.jpg", file.read(), content_type="image/jpeg")

    variant = ProductVariant.objects.create(product=product, sku="IMG-VAR", price=10, stock=5)

    data = {
        'product': product.id,
        'variant': variant.id,
        'image': image_file,
        'alt_text': 'Alt Text'
    }
    serializer = ProductImageSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    img = serializer.save()
    assert img.alt_text == 'Alt Text'