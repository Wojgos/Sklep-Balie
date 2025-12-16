from decimal import Decimal

from django.db import models
from django.utils import timezone
from parler.models import TranslatableModel, TranslatedFields


class LoyaltyReward(TranslatableModel):
    """Nagroda w programie lojalnościowym (Tłumaczona)."""

    points_required = models.PositiveIntegerField(verbose_name="Wymagane punkty")
    reward_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Wartość nagrody")
    is_percentage = models.BooleanField(default=False, verbose_name="Czy procentowa?")
    active = models.BooleanField(default=True, verbose_name="Aktywna")

    translations = TranslatedFields(
        name=models.CharField(max_length=255, verbose_name="Nazwa nagrody"),
        description=models.CharField(max_length=255, verbose_name="Opis (dla klienta)")
    )

    class Meta:
        verbose_name = "Nagroda lojalnościowa"
        verbose_name_plural = "Nagrody lojalnościowe"
        ordering = ['points_required']

    def __str__(self):
        desc = self.safe_translation_getter('description', any_language=True) or "(brak opisu)"
        return f"{self.points_required} pkt -> {desc}"


class RedeemedReward(models.Model):
    """Historia zrealizowanych nagród przez użytkowników."""
    user = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='redeemed_rewards',
        verbose_name="Użytkownik"
    )
    reward = models.ForeignKey(
        LoyaltyReward,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Nagroda"
    )
    reward_name = models.CharField(max_length=200, verbose_name="Nazwa nagrody")
    points_spent = models.PositiveIntegerField(verbose_name="Wydane punkty")
    coupon_code = models.CharField(max_length=50, verbose_name="Kod kuponu")
    redeemed_at = models.DateTimeField(auto_now_add=True, verbose_name="Data realizacji")
    
    class Meta:
        verbose_name = "Zrealizowana nagroda"
        verbose_name_plural = "Zrealizowane nagrody"
        ordering = ['-redeemed_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.reward_name} ({self.redeemed_at.strftime('%Y-%m-%d')})"


class DiscountCoupon(models.Model):
    """
    Model kuponu rabatowego.
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Kod kuponu"
    )

    user = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='loyalty_coupons',
        verbose_name="Właściciel kuponu"
    )

    valid_from = models.DateTimeField(
        default=timezone.now,
        verbose_name="Ważny od"
    )

    valid_to = models.DateTimeField(verbose_name="Ważny do")

    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Wartość zniżki"
    )

    is_percentage = models.BooleanField(
        default=True,
        verbose_name="Czy zniżka procentowa?"
    )

    usage_limit = models.PositiveIntegerField(
        default=1,
        verbose_name="Limit użyć"
    )

    usage_count = models.PositiveIntegerField(
        default=0,
        editable=False,
        verbose_name="Liczba użyć"
    )

    active = models.BooleanField(default=True, verbose_name="Aktywny")

    class Meta:
        verbose_name = "Kupon rabatowy"
        verbose_name_plural = "Kupony rabatowe"

    def __str__(self):
        return self.code

    def is_valid(self):
        """Sprawdza, czy kupon jest gotowy do użycia."""
        now = timezone.now()

        if not self.active:
            return False, "Ten kupon jest nieaktywny."
        if self.valid_from > now:
            return False, "Ten kupon jeszcze nie jest aktywny."
        if self.valid_to < now:
            return False, "Ten kupon wygasł."
        if self.usage_count >= self.usage_limit:
            return False, "Limit użycia tego kuponu został wyczerpany."

        return True, "Kupon jest prawidłowy."

    def apply_discount(self, total_price):
        """Oblicza cenę po zniżce."""
        if self.is_percentage:
            discount_amount = (self.value / Decimal(100)) * total_price
        else:
            discount_amount = self.value

        discount_amount = min(discount_amount, total_price)

        new_total_price = total_price - discount_amount

        return new_total_price, discount_amount
