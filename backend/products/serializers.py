# products/serializers.py
from rest_framework import serializers
from .models import (
    Product, Category, ProductAttribute, AttributeValue,
    ProductVariant, ProductImage
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'product_count']


class AttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = ['id', 'attribute', 'value']


class ProductAttributeSerializer(serializers.ModelSerializer):
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'values']


class ProductVariantAttributeSerializer(serializers.ModelSerializer):
    attribute = serializers.StringRelatedField()

    class Meta:
        model = AttributeValue
        fields = ['attribute', 'value']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_main', 'product', 'variant')
        extra_kwargs = {
            'product': {'write_only': True},
            'variant': {'write_only': True},
        }


class ProductVariantSerializer(serializers.ModelSerializer):
    attributes_details = ProductVariantAttributeSerializer(
        many=True, read_only=True, source='attributes'
    )
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'sku', 'name', 'price', 'stock',
            'low_stock_threshold', 'available',
            'attributes_details', 'images'
        ]


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    available_attributes = serializers.SerializerMethodField()

    class Meta:
        model = Product
        lookup_field = 'slug'
        fields = [
            'id', 'category', 'category_id', 'category_name', 'name',
            'slug', 'description', 'available', 'available_attributes', 'variants', 'images',
            'created_at', 'updated_at'
        ]

    def get_available_attributes(self, instance):
        attributes_map = {}

        variants = instance.variants.filter(available=True).prefetch_related('attributes__attribute')

        for variant in variants:
            for attr_value in variant.attributes.all():
                attr_name = attr_value.attribute.name
                value = attr_value.value

                if attr_name not in attributes_map:
                    attributes_map[attr_name] = set()

                attributes_map[attr_name].add(value)

        return {key: sorted(list(val)) for key, val in attributes_map.items()}
