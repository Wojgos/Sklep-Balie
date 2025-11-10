# orders/serializers.py
from rest_framework import serializers

from products.serializers import ProductVariantSerializer
from .models import Order, OrderItem


class OrderItemCreateSerializer(serializers.Serializer):
    """
    Serializer DANYCH WEJŚCIOWYCH dla pozycji w zamówieniu.
    Oczekuje ID wariantu i ilości.
    """
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer DANYCH WEJŚCIOWYCH do tworzenia nowego zamówienia.
    Przyjmuje dane adresowe oraz zagnieżdżoną listę 'items'.
    """
    items = OrderItemCreateSerializer(many=True, write_only=True)

    coupon_code = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'first_name', 'last_name', 'email', 'address',
            'postal_code', 'city',
            'items',
            'coupon_code'
        ]


class OrderItemResponseSerializer(serializers.ModelSerializer):
    """Serializer DANYCH WYJŚCIOWYCH dla pozycji w zamówieniu."""
    variant = ProductVariantSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ('product_name', 'price', 'quantity', 'variant')


class OrderResponseSerializer(serializers.ModelSerializer):
    """
    Serializer DANYCH WYJŚCIOWYCH dla pełnego zamówienia.
    To jest klasa, której brakowało.
    """
    items = OrderItemResponseSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source='user.username', read_only=True, default='Gość')

    class Meta:
        model = Order
        fields = [
            'id',
            'customer_username',
            'first_name', 'last_name', 'email', 'address',
            'postal_code', 'city', 'items', 'created_at',
            'total_price',
            'paid',
            'status',
            'tracking_number',
        ]
        read_only_fields = fields


class OrderAdminUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer dla Admina do aktualizacji statusu zamówienia.
    Pozwala na zmianę tylko tych kilku pól.
    """

    class Meta:
        model = Order
        fields = ('status', 'tracking_number', 'paid')
