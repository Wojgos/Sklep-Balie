from rest_framework import serializers
from .models import DiscountCoupon, LoyaltyReward, RedeemedReward
from django.utils import translation


class LoyaltyRewardSerializer(serializers.ModelSerializer):
    """Serializer dla nagród lojalnościowych z obsługą tłumaczeń."""

    # Jawnie deklarujemy pola tłumaczone
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = LoyaltyReward
        fields = [
            'id',
            'name', 'description',  # Pola tłumaczone
            'points_required', 'reward_value', 'is_percentage', 'active'  # Pola zwykłe
        ]

    def create(self, validated_data):
        # 1. Wyciągamy dane tekstowe (tłumaczone)
        name = validated_data.pop('name')
        description = validated_data.pop('description', '')

        # 2. Tworzymy obiekt (tylko z polami nietłumaczonymi)
        instance = LoyaltyReward.objects.create(**validated_data)

        # 3. Zapisujemy tłumaczenie dla aktualnego języka
        instance.set_current_language(translation.get_language())
        instance.name = name
        instance.description = description
        instance.save()

        return instance

    def update(self, instance, validated_data):
        # 1. Wyciągamy dane tekstowe
        name = validated_data.pop('name', None)
        description = validated_data.pop('description', None)

        # 2. Aktualizujemy pola nietłumaczone (np. punkty, wartość)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 3. Aktualizujemy tłumaczenie (jeśli podano nowe dane)
        if name is not None or description is not None:
            instance.set_current_language(translation.get_language())
            if name is not None:
                instance.name = name
            if description is not None:
                instance.description = description

        instance.save()
        return instance


class RedeemRewardInputSerializer(serializers.Serializer):
    reward_id = serializers.IntegerField(required=True)


class RedeemedRewardSerializer(serializers.ModelSerializer):
    """Serializer dla zrealizowanych nagród."""

    is_used = serializers.SerializerMethodField()

    class Meta:
        model = RedeemedReward
        fields = ['id', 'reward_name', 'points_spent', 'coupon_code', 'redeemed_at', 'is_used']
        read_only_fields = ['id', 'redeemed_at', 'is_used']

    def get_is_used(self, obj):
        coupon = DiscountCoupon.objects.filter(code=obj.coupon_code).only('usage_count').first()
        if not coupon:
            return False
        return coupon.usage_count >= coupon.usage_limit if coupon.usage_limit else coupon.usage_count > 0


class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = (
            'id', 'code', 'valid_from', 'valid_to', 'value',
            'is_percentage', 'usage_limit', 'usage_count', 'active', 'user'
        )
        read_only_fields = ('usage_count', 'user')
