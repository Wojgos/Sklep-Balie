import pytest
from decimal import Decimal
from django.utils import timezone, translation
from promotions.models import DiscountCoupon, LoyaltyReward, RedeemedReward
from promotions.serializers import (
    LoyaltyRewardSerializer,
    RedeemRewardInputSerializer,
    RedeemedRewardSerializer,
    DiscountCouponSerializer
)


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(username="testuser", password="password")


@pytest.fixture
def loyalty_reward():
    return LoyaltyReward.objects.create(
        name="Test Reward",
        description="Test Desc",
        points_required=100,
        reward_value=10.00,
        is_percentage=False,
        active=True
    )


@pytest.fixture
def discount_coupon(db):
    return DiscountCoupon.objects.create(
        code="TEST-CODE",
        valid_from=timezone.now(),
        valid_to=timezone.now() + timezone.timedelta(days=30),
        value=10.00,
        is_percentage=False,
        usage_limit=1,
        usage_count=0,
        active=True
    )


@pytest.fixture
def redeemed_reward(db, discount_coupon, user):
    return RedeemedReward.objects.create(
        user=user,
        reward_name="Test Reward",
        points_spent=100,
        coupon_code=discount_coupon.code
    )


@pytest.mark.django_db
def test_loyalty_reward_serializer_create():
    data = {
        "name": "New Reward",
        "description": "New Desc",
        "points_required": 50,
        "reward_value": 5.00,
        "is_percentage": True,
        "active": True
    }

    with translation.override('pl'):
        serializer = LoyaltyRewardSerializer(data=data)
        assert serializer.is_valid()
        instance = serializer.save()

        assert instance.name == "New Reward"
        assert instance.description == "New Desc"
        assert instance.points_required == 50
        assert instance.reward_value == Decimal('5.00')


@pytest.mark.django_db
def test_loyalty_reward_serializer_update(loyalty_reward):
    data = {
        "name": "Updated Reward",
        "points_required": 150
    }

    with translation.override('pl'):
        serializer = LoyaltyRewardSerializer(instance=loyalty_reward, data=data, partial=True)
        assert serializer.is_valid()
        instance = serializer.save()

        assert instance.name == "Updated Reward"
        assert instance.points_required == 150
        assert instance.description == "Test Desc"


@pytest.mark.django_db
def test_redeem_reward_input_serializer_valid():
    data = {"reward_id": 123}
    serializer = RedeemRewardInputSerializer(data=data)
    assert serializer.is_valid()
    assert serializer.validated_data['reward_id'] == 123


@pytest.mark.django_db
def test_redeem_reward_input_serializer_invalid():
    data = {}
    serializer = RedeemRewardInputSerializer(data=data)
    assert not serializer.is_valid()
    assert 'reward_id' in serializer.errors


@pytest.mark.django_db
def test_redeemed_reward_serializer_output(redeemed_reward):
    serializer = RedeemedRewardSerializer(instance=redeemed_reward)
    data = serializer.data

    assert data['reward_name'] == "Test Reward"
    assert data['points_spent'] == 100
    assert data['coupon_code'] == "TEST-CODE"
    assert data['is_used'] is False


@pytest.mark.django_db
def test_redeemed_reward_serializer_is_used_true(redeemed_reward, discount_coupon):
    discount_coupon.usage_count = 1
    discount_coupon.save()

    serializer = RedeemedRewardSerializer(instance=redeemed_reward)
    assert serializer.data['is_used'] is True


@pytest.mark.django_db
def test_redeemed_reward_serializer_no_coupon(redeemed_reward):
    redeemed_reward.coupon_code = "NON_EXISTENT"
    redeemed_reward.save()

    serializer = RedeemedRewardSerializer(instance=redeemed_reward)
    assert serializer.data['is_used'] is False


@pytest.mark.django_db
def test_discount_coupon_serializer_valid(db):
    data = {
        "code": "NEW-CODE",
        "valid_from": timezone.now(),
        "valid_to": timezone.now() + timezone.timedelta(days=7),
        "value": 20.00,
        "is_percentage": True,
        "usage_limit": 5,
        "active": True
    }
    serializer = DiscountCouponSerializer(data=data)
    assert serializer.is_valid()
    instance = serializer.save()

    assert instance.code == "NEW-CODE"
    assert instance.is_percentage is True


@pytest.mark.django_db
def test_discount_coupon_serializer_read_only_fields(discount_coupon):
    data = {
        "code": "UPDATED",
        "usage_count": 999
    }
    serializer = DiscountCouponSerializer(instance=discount_coupon, data=data, partial=True)
    assert serializer.is_valid()
    instance = serializer.save()

    assert instance.code == "UPDATED"
    assert instance.usage_count == 0