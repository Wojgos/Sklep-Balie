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
        # Liczba użyć jest tylko do odczytu dla admina
        read_only_fields = ('usage_count', 'user')
