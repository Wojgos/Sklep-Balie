# promotions/serializers.py
from rest_framework import serializers
from .models import DiscountCoupon, LoyaltyReward, RedeemedReward


class LoyaltyRewardSerializer(serializers.ModelSerializer):
    """Serializer dla nagród lojalnościowych."""

    class Meta:
        model = LoyaltyReward
        fields = ['id', 'name', 'points_required', 'reward_value', 'is_percentage', 'description', 'active',
                  'created_at']
        read_only_fields = ['created_at']


class RedeemRewardInputSerializer(serializers.Serializer):
    reward_id = serializers.IntegerField(required=True)


class RedeemedRewardSerializer(serializers.ModelSerializer):
    """Serializer dla zrealizowanych nagród."""

    class Meta:
        model = RedeemedReward
        fields = ['id', 'reward_name', 'points_spent', 'coupon_code', 'redeemed_at']
        read_only_fields = ['id', 'redeemed_at']


class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = (
            'id', 'code', 'valid_from', 'valid_to', 'value',
            'is_percentage', 'usage_limit', 'usage_count', 'active'
        )
        # Liczba użyć jest tylko do odczytu dla admina
        read_only_fields = ('usage_count',)
