# promotions/serializers.py
from rest_framework import serializers
from .models import DiscountCoupon, LoyaltyReward


class LoyaltyRewardSerializer(serializers.ModelSerializer):
    """Serializer dla nagród lojalnościowych."""

    class Meta:
        model = LoyaltyReward
        fields = ['id', 'points_required', 'reward_value', 'is_percentage', 'description', 'active']


class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = (
            'id', 'code', 'valid_from', 'valid_to', 'value',
            'is_percentage', 'usage_limit', 'usage_count', 'active'
        )
        # Liczba użyć jest tylko do odczytu dla admina
        read_only_fields = ('usage_count',)
