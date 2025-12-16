import pytest
from decimal import Decimal
from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from promotions.models import DiscountCoupon, LoyaltyReward, RedeemedReward


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        username="client",
        password="password",
        email="client@test.com",
        loyalty_points=100
    )


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_user(
        username="admin",
        password="password",
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def active_reward():
    return LoyaltyReward.objects.create(
        name="Reward 1",
        description="Desc",
        points_required=50,
        reward_value=10.00,
        is_percentage=False,
        active=True
    )


@pytest.fixture
def discount_coupon():
    return DiscountCoupon.objects.create(
        code="TEST10",
        value=10.00,
        is_percentage=False,
        active=True,
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=1)
    )


@pytest.mark.django_db
def test_coupon_admin_viewset_permissions(api_client, user, admin_user):
    url = reverse('promotions:coupon-list')

    api_client.force_authenticate(user=user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    api_client.force_authenticate(user=admin_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_loyalty_reward_admin_viewset_permissions(api_client, user, admin_user):
    url = reverse('promotions:reward-list')

    api_client.force_authenticate(user=user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    api_client.force_authenticate(user=admin_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_loyalty_offers_view(api_client, user):
    LoyaltyReward.objects.create(name="Active", points_required=10, reward_value=5, active=True)
    LoyaltyReward.objects.create(name="Inactive", points_required=10, reward_value=5, active=False)

    url = reverse('promotions:loyalty-offers')
    api_client.force_authenticate(user=user)

    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['name'] == "Active"


@pytest.mark.django_db
def test_redeem_loyalty_points_success(api_client, user, active_reward):
    url = reverse('promotions:loyalty-redeem')
    api_client.force_authenticate(user=user)

    data = {"reward_id": active_reward.id}
    response = api_client.post(url, data)

    assert response.status_code == status.HTTP_201_CREATED
    assert "coupon_code" in response.data

    user.refresh_from_db()
    assert user.loyalty_points == 50
    assert DiscountCoupon.objects.count() == 1
    assert RedeemedReward.objects.count() == 1


@pytest.mark.django_db
def test_redeem_loyalty_points_insufficient_funds(api_client, user, active_reward):
    user.loyalty_points = 10
    user.save()

    url = reverse('promotions:loyalty-redeem')
    api_client.force_authenticate(user=user)

    data = {"reward_id": active_reward.id}
    response = api_client.post(url, data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Masz za mało punktów" in str(response.data)


@pytest.mark.django_db
def test_validate_coupon_success_fixed(api_client, discount_coupon):
    url = reverse('promotions:validate-coupon')
    data = {
        "code": discount_coupon.code,
        "cart_total": 100.00
    }

    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['valid'] is True
    assert response.data['discount_amount'] == 10.00
    assert response.data['final_total'] == 90.00


@pytest.mark.django_db
def test_validate_coupon_success_percentage(api_client):
    coupon = DiscountCoupon.objects.create(
        code="PERC20", value=20.00, is_percentage=True, active=True,
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=1)
    )

    url = reverse('promotions:validate-coupon')
    data = {
        "code": "PERC20",
        "cart_total": 200.00
    }

    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['discount_amount'] == 40.00
    assert response.data['final_total'] == 160.00


@pytest.mark.django_db
def test_validate_coupon_failures(api_client, discount_coupon):
    url = reverse('promotions:validate-coupon')

    response = api_client.post(url, {"code": "BADCODE", "cart_total": 100})
    assert response.status_code == status.HTTP_404_NOT_FOUND

    discount_coupon.valid_to = timezone.now() - timedelta(days=1)
    discount_coupon.save()
    response = api_client.post(url, {"code": discount_coupon.code, "cart_total": 100})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "wygasł" in str(response.data)

    discount_coupon.valid_to = timezone.now() + timedelta(days=1)
    discount_coupon.usage_limit = 1
    discount_coupon.usage_count = 1
    discount_coupon.save()
    response = api_client.post(url, {"code": discount_coupon.code, "cart_total": 100})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "wykorzystany" in str(response.data)

    response = api_client.post(url, {"code": "ANY", "cart_total": -50})
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_my_redeemed_rewards_view(api_client, user, active_reward):
    RedeemedReward.objects.create(
        user=user,
        reward=active_reward,
        reward_name="Test Reward",
        points_spent=50,
        coupon_code="ABC"
    )

    url = reverse('promotions:my-redeemed-rewards')
    api_client.force_authenticate(user=user)

    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['coupon_code'] == "ABC"