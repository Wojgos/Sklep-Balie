from django.contrib import admin
from .models import LoyaltyReward, DiscountCoupon, RedeemedReward


@admin.register(LoyaltyReward)
class LoyaltyRewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'points_required', 'reward_value', 'is_percentage', 'active', 'created_at']
    list_filter = ['active', 'is_percentage']
    search_fields = ['name', 'description']


@admin.register(DiscountCoupon)
class DiscountCouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'value', 'is_percentage', 'usage_count', 'usage_limit', 'valid_to', 'active']
    list_filter = ['active', 'is_percentage']
    search_fields = ['code']


@admin.register(RedeemedReward)
class RedeemedRewardAdmin(admin.ModelAdmin):
    list_display = ['user', 'reward_name', 'points_spent', 'coupon_code', 'redeemed_at']
    list_filter = ['redeemed_at']
    search_fields = ['user__email', 'reward_name', 'coupon_code']
    readonly_fields = ['redeemed_at']
