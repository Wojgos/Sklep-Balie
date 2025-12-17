"""
Tests for promotion models.
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from promotions.models import DiscountCoupon, LoyaltyReward, RedeemedReward


@pytest.mark.django_db
class TestDiscountCoupon:
    """Tests for DiscountCoupon model."""
    
    def test_is_valid_active_coupon(self, discount_coupon):
        """Test valid active coupon."""
        is_valid, message = discount_coupon.is_valid()
        assert is_valid is True
        assert "prawidłowy" in message.lower()
    
    def test_is_valid_inactive_coupon(self, discount_coupon):
        """Test inactive coupon."""
        discount_coupon.active = False
        discount_coupon.save()
        
        is_valid, message = discount_coupon.is_valid()
        assert is_valid is False
        assert "nieaktywny" in message.lower()
    
    def test_is_valid_not_yet_active(self, discount_coupon):
        """Test coupon that hasn't started yet."""
        discount_coupon.valid_from = timezone.now() + timedelta(days=1)
        discount_coupon.save()
        
        is_valid, message = discount_coupon.is_valid()
        assert is_valid is False
        assert "jeszcze nie jest aktywny" in message.lower()
    
    def test_is_valid_expired_coupon(self, discount_coupon):
        """Test expired coupon."""
        discount_coupon.valid_to = timezone.now() - timedelta(days=1)
        discount_coupon.save()
        
        is_valid, message = discount_coupon.is_valid()
        assert is_valid is False
        assert "wygasł" in message.lower()
    
    def test_is_valid_usage_limit_exceeded(self, discount_coupon):
        """Test coupon with exceeded usage limit."""
        discount_coupon.usage_limit = 5
        discount_coupon.usage_count = 5
        discount_coupon.save()
        
        is_valid, message = discount_coupon.is_valid()
        assert is_valid is False
        assert "wyczerpany" in message.lower()
    
    def test_apply_discount_fixed_amount(self, discount_coupon):
        """Test applying fixed amount discount."""
        total = Decimal("100.00")
        final_price, discount = discount_coupon.apply_discount(total)
        
        assert discount == Decimal("10.00")
        assert final_price == Decimal("90.00")
    
    def test_apply_discount_percentage(self, percentage_coupon):
        """Test applying percentage discount."""
        total = Decimal("100.00")
        final_price, discount = percentage_coupon.apply_discount(total)
        
        assert discount == Decimal("20.00")
        assert final_price == Decimal("80.00")
    
    def test_apply_discount_percentage_max_discount(self, percentage_coupon):
        """Test percentage discount doesn't exceed total."""
        total = Decimal("50.00")
        final_price, discount = percentage_coupon.apply_discount(total)
        
        assert discount == Decimal("10.00")  # 20% of 50
        assert final_price == Decimal("40.00")
    
    def test_apply_discount_fixed_exceeds_total(self):
        """Test fixed discount doesn't exceed total."""
        coupon = DiscountCoupon.objects.create(
            code="BIG50",
            value=Decimal("50.00"),
            is_percentage=False,
            active=True,
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30)
        )
        
        total = Decimal("30.00")
        final_price, discount = coupon.apply_discount(total)
        
        assert discount == Decimal("30.00")  # Can't exceed total
        assert final_price == Decimal("0.00")
    
    def test_coupon_str_representation(self, discount_coupon):
        """Test string representation."""
        assert str(discount_coupon) == "TEST10"


@pytest.mark.django_db
class TestLoyaltyReward:
    """Tests for LoyaltyReward model."""
    
    def test_reward_str_representation(self, loyalty_reward):
        """Test string representation."""
        str_repr = str(loyalty_reward)
        # Model returns: f"{self.points_required} pkt -> {desc}"
        assert "50" in str_repr  # points_required
        assert "pkt" in str_repr
        # Check for description (which is used in __str__)
        assert "Testowa Nagroda" in str_repr or "Test Reward" in str_repr or "Opis nagrody" in str_repr or "Reward description" in str_repr
    
    def test_reward_ordering(self):
        """Test rewards are ordered by points_required."""
        reward1 = LoyaltyReward.objects.create(
            points_required=100,
            reward_value=Decimal("20.00"),
            is_percentage=False,
            active=True
        )
        reward1.set_current_language('pl')
        reward1.name = "Reward 100"
        reward1.save()
        
        reward2 = LoyaltyReward.objects.create(
            points_required=50,
            reward_value=Decimal("10.00"),
            is_percentage=False,
            active=True
        )
        reward2.set_current_language('pl')
        reward2.name = "Reward 50"
        reward2.save()
        
        rewards = list(LoyaltyReward.objects.all())
        assert rewards[0].points_required == 50
        assert rewards[1].points_required == 100


@pytest.mark.django_db
class TestRedeemedReward:
    """Tests for RedeemedReward model."""
    
    def test_redeemed_reward_creation(self, user, loyalty_reward, discount_coupon):
        """Test creating redeemed reward."""
        redeemed = RedeemedReward.objects.create(
            user=user,
            reward=loyalty_reward,
            reward_name="Test Reward",
            points_spent=50,
            coupon_code=discount_coupon.code
        )
        
        assert redeemed.user == user
        assert redeemed.reward == loyalty_reward
        assert redeemed.points_spent == 50
        assert redeemed.coupon_code == discount_coupon.code
    
    def test_redeemed_reward_str_representation(self, user, loyalty_reward, discount_coupon):
        """Test string representation."""
        redeemed = RedeemedReward.objects.create(
            user=user,
            reward=loyalty_reward,
            reward_name="Test Reward",
            points_spent=50,
            coupon_code=discount_coupon.code
        )
        
        str_repr = str(redeemed)
        assert user.email in str_repr
        assert "Test Reward" in str_repr
    
    def test_redeemed_reward_ordering(self, user, loyalty_reward, discount_coupon):
        """Test redeemed rewards are ordered by redeemed_at descending."""
        redeemed1 = RedeemedReward.objects.create(
            user=user,
            reward=loyalty_reward,
            reward_name="First",
            points_spent=50,
            coupon_code="CODE1"
        )
        
        redeemed2 = RedeemedReward.objects.create(
            user=user,
            reward=loyalty_reward,
            reward_name="Second",
            points_spent=30,
            coupon_code="CODE2"
        )
        
        rewards = list(RedeemedReward.objects.all())
        assert rewards[0] == redeemed2  # Most recent first
        assert rewards[1] == redeemed1

