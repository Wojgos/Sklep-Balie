import uuid
from rest_framework import serializers
from django.utils import translation
from .models import (
    Product, Category, ProductAttribute, AttributeValue,
    ProductVariant, ProductImage
)


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    slug = serializers.CharField(read_only=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        # Pamiętaj, żeby 'image' i 'description' były tu wymienione
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']

    def create(self, validated_data):
        # Wyciągamy pola tłumaczone
        name = validated_data.pop('name')
        description = validated_data.pop('description', '')

        # Tworzymy obiekt (tu zapisze się 'image' jeśli jest w validated_data)
        category = Category.objects.create(**validated_data)

        # Zapisujemy tłumaczenia
        category.set_current_language(translation.get_language())
        category.name = name
        category.description = description
        category.save()
        return category

    def update(self, instance, validated_data):
        # 1. Wyciągamy pola tłumaczone (name, description)
        name = validated_data.pop('name', None)
        description = validated_data.pop('description', None)

        # 2. Aktualizujemy pola standardowe (np. image)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 3. Aktualizujemy tłumaczenia (jeśli zostały przesłane)
        if name is not None or description is not None:
            instance.set_current_language(translation.get_language())
            if name is not None:
                instance.name = name
            if description is not None:
                instance.description = description

        instance.save()
        return instance


class AttributeValueSerializer(serializers.ModelSerializer):
    value = serializers.CharField()

    class Meta:
        model = AttributeValue
        fields = ['id', 'attribute', 'value']

    def create(self, validated_data):
        value = validated_data.pop('value')
        instance = AttributeValue.objects.create(**validated_data)
        instance.set_current_language(translation.get_language())
        instance.value = value
        instance.save()
        return instance


class ProductAttributeSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'values']

    def create(self, validated_data):
        name = validated_data.pop('name')
        instance = ProductAttribute.objects.create(**validated_data)
        instance.set_current_language(translation.get_language())
        instance.name = name
        instance.save()
        return instance


class ProductVariantAttributeSerializer(serializers.ModelSerializer):
    attribute = serializers.StringRelatedField()
    value = serializers.SerializerMethodField()

    class Meta:
        model = AttributeValue
        fields = ['attribute', 'value']

    def get_value(self, obj):
        return obj.safe_translation_getter('value', any_language=True)


class ProductImageSerializer(serializers.ModelSerializer):
    alt_text = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_main', 'product', 'variant')
        extra_kwargs = {
            'product': {'write_only': True},
            'variant': {'write_only': True},
        }

    def create(self, validated_data):
        alt_text = validated_data.pop('alt_text', '')
        instance = ProductImage.objects.create(**validated_data)
        instance.set_current_language(translation.get_language())
        instance.alt_text = alt_text
        instance.save()
        return instance


class ProductVariantSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True)
    attributes_details = ProductVariantAttributeSerializer(
        many=True, read_only=True, source='attributes'
    )
    images = ProductImageSerializer(many=True, read_only=True)
    attribute_values = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Lista ID wartości atrybutów do przypisania"
    )

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'sku', 'name', 'price', 'stock',
            'low_stock_threshold', 'available',
            'attributes_details', 'attribute_values', 'images'
        ]

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        attribute_values = validated_data.pop('attribute_values', [])
        
        instance = ProductVariant.objects.create(**validated_data)
        instance.set_current_language(translation.get_language())
        instance.name = name
        instance.save()
        
        # Set attributes
        if attribute_values:
            instance.attributes.set(attribute_values)
        
        return instance

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        attribute_values = validated_data.pop('attribute_values', None)
        
        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update translatable field if provided
        if name is not None:
            instance.set_current_language(translation.get_language())
            instance.name = name
        
        instance.save()
        
        # Update attributes if provided
        if attribute_values is not None:
            instance.attributes.set(attribute_values)
        
        return instance


class ProductSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    slug = serializers.CharField(read_only=True)

    variants = ProductVariantSerializer(many=True, read_only=True)
    category = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True, required=False)
    category_name = serializers.CharField(source='category.name', read_only=True)

    images = ProductImageSerializer(many=True, read_only=True)
    available_attributes = serializers.SerializerMethodField()

    category_write = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    price = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    stock = serializers.IntegerField(write_only=True, required=False, default=0)
    image = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Product
        lookup_field = 'slug'
        fields = [
            'id', 'category', 'category_id', 'category_name', 'category_write',
            'name', 'slug', 'description',
            'available', 'attributes_config', 'available_attributes', 'variants', 'images',
            'price', 'stock', 'image',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        price = validated_data.pop('price', None)
        stock = validated_data.pop('stock', 0)
        image_url = validated_data.pop('image', None)

        name = validated_data.pop('name')
        description = validated_data.pop('description', '')

        product = Product.objects.create(**validated_data)

        product.set_current_language(translation.get_language())
        product.name = name
        product.description = description
        product.save()

        if price is not None:
            sku = f"SKU-{product.id}-{uuid.uuid4().hex[:8].upper()}"

            variant = ProductVariant.objects.create(
                product=product,
                sku=sku,
                price=price,
                stock=stock,
                available=True
            )
            variant.set_current_language(translation.get_language())
            variant.name = 'Wariant domyślny'
            variant.save()

            if image_url:
                img = ProductImage.objects.create(
                    product=product,
                    variant=variant,
                    image=image_url,
                    is_main=True
                )
                img.set_current_language(translation.get_language())
                img.alt_text = name
                img.save()

        return product

    def update(self, instance, validated_data):
        price = validated_data.pop('price', None)
        stock = validated_data.pop('stock', None)
        image_url = validated_data.pop('image', None)
        name = validated_data.pop('name', None)
        description = validated_data.pop('description', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if name is not None or description is not None:
            instance.set_current_language(translation.get_language())
            if name is not None: instance.name = name
            if description is not None: instance.description = description

        instance.save()

        if price is not None or stock is not None or image_url is not None:
            variant = instance.variants.first()

            if not variant:
                sku = f"SKU-{instance.id}-{uuid.uuid4().hex[:8].upper()}"
                variant = ProductVariant.objects.create(
                    product=instance,
                    sku=sku,
                    price=price or 0,
                    stock=stock or 0,
                    available=True
                )
                variant.set_current_language(translation.get_language())
                variant.name = 'Wariant domyślny'
                variant.save()
            else:
                if price is not None: variant.price = price
                if stock is not None: variant.stock = stock
                variant.save()

            if image_url is not None:
                main_image = ProductImage.objects.filter(product=instance, is_main=True).first()

                if main_image:
                    main_image.image = image_url
                    main_image.save()
                else:
                    img = ProductImage.objects.create(
                        product=instance,
                        variant=variant,
                        image=image_url,
                        is_main=True
                    )
                    img.set_current_language(translation.get_language())
                    img.alt_text = instance.safe_translation_getter('name', any_language=True) or "Product Image"
                    img.save()

        return instance

    def get_available_attributes(self, instance):
        """
        Generate available attributes from actual ProductVariant instances.
        This ensures frontend always displays real product options from the database.
        """
        attributes_map = {}
        variants = instance.variants.filter(available=True).prefetch_related('attributes__attribute')

        for variant in variants:
            for attr_value in variant.attributes.all():
                attr_name = attr_value.attribute.safe_translation_getter('name', any_language=True)
                value = attr_value.safe_translation_getter('value', any_language=True)

                if attr_name and attributes_map.get(attr_name) is None:
                    attributes_map[attr_name] = set()

                if attr_name:
                    attributes_map[attr_name].add(value)

        return {key: sorted(list(val)) for key, val in attributes_map.items()}

    def to_representation(self, instance):
        """
        Override to add image field in read operations.
        Returns the main image from the first variant or a placeholder.
        """
        representation = super().to_representation(instance)
        
        # Get main image from product images or first variant
        main_image = None
        product_images = instance.images.filter(is_main=True).first()
        
        if product_images:
            main_image = product_images.image.url if product_images.image else None
        elif instance.variants.exists():
            # Get image from first variant
            first_variant = instance.variants.first()
            variant_image = ProductImage.objects.filter(variant=first_variant, is_main=True).first()
            if variant_image and variant_image.image:
                main_image = variant_image.image.url
        
        # Use placeholder if no image found
        if not main_image:
            from django.conf import settings
            main_image = settings.MEDIA_URL + 'product_images/placeholder.jpg'
        
        representation['image'] = main_image
        return representation