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
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']
        read_only_fields = ['slug']


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
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'product_name', 'product_slug', 'category_name',
            'sku', 'name', 'price', 'stock',
            'low_stock_threshold', 'available',
            'attributes_details', 'images'
        ]


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True, required=False)
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    available_attributes = serializers.SerializerMethodField()
    
    # Pola do zapisu (write-only) używane przez panel admina
    category_write = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    # Pola dla domyślnego wariantu (opcjonalne)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    stock = serializers.IntegerField(write_only=True, required=False, default=0)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Product
        lookup_field = 'slug'
        fields = [
            'id', 'category', 'category_id', 'category_name', 'category_write', 'name',
            'slug', 'description', 'available', 'attributes_config', 'available_attributes', 'variants', 'images',
            'price', 'stock', 'image',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        # Wyciągamy dane dla wariantu
        price = validated_data.pop('price', None)
        stock = validated_data.pop('stock', 0)
        image_file = validated_data.pop('image', None)
        
        # Tworzymy produkt
        product = Product.objects.create(**validated_data)
        
        # Jeśli podano cenę, tworzymy domyślny wariant
        if price is not None:
            import uuid
            sku = f"SKU-{product.id}-{uuid.uuid4().hex[:8].upper()}"
            
            variant = ProductVariant.objects.create(
                product=product,
                name='Wariant domyślny',
                sku=sku,
                price=price,
                stock=stock,
                available=True
            )
            
            # Dodajemy zdjęcie jeśli podano (teraz jako plik)
            if image_file:
                ProductImage.objects.create(
                    product=product,
                    variant=variant,
                    image=image_file,
                    is_main=True,
                    alt_text=product.name
                )
        
        return product
    
    def update(self, instance, validated_data):
        # Wyciągamy dane dla wariantu
        price = validated_data.pop('price', None)
        stock = validated_data.pop('stock', None)
        image_file = validated_data.pop('image', None)
        
        # Aktualizujemy produkt
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Aktualizujemy lub tworzymy domyślny wariant
        if price is not None or stock is not None or image_file is not None:
            # Szukamy pierwszego wariantu lub tworzymy nowy
            variant = instance.variants.first()
            
            if not variant:
                import uuid
                sku = f"SKU-{instance.id}-{uuid.uuid4().hex[:8].upper()}"
                variant = ProductVariant.objects.create(
                    product=instance,
                    name='Wariant domyślny',
                    sku=sku,
                    price=price or 0,
                    stock=stock or 0,
                    available=True
                )
            else:
                if price is not None:
                    variant.price = price
                if stock is not None:
                    variant.stock = stock
                variant.save()
            
            # Aktualizujemy lub dodajemy zdjęcie (teraz jako plik)
            if image_file is not None:
                main_image = ProductImage.objects.filter(
                    product=instance,
                    is_main=True
                ).first()
                
                if main_image:
                    main_image.image = image_file
                    main_image.save()
                else:
                    ProductImage.objects.create(
                        product=instance,
                        variant=variant,
                        image=image_file,
                        is_main=True,
                        alt_text=instance.name
                    )
        
        return instance

    def get_available_attributes(self, instance):
        # Jeśli produkt ma attributes_config (konfiguracje z panelu admina), użyj ich
        if instance.attributes_config:
            attributes_map = {}
            for attr_config in instance.attributes_config:
                attr_name = attr_config.get('name')
                variants = attr_config.get('variants', [])
                
                if attr_name and variants:
                    # Zbieramy nazwy wariantów (wartości)
                    values = [v.get('name') for v in variants if v.get('name')]
                    if values:
                        attributes_map[attr_name] = sorted(values)
            
            if attributes_map:
                return attributes_map
        
        # Fallback: pobierz z wariantów jeśli nie ma attributes_config
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
