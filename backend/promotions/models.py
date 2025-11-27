# promotions/models.py
from decimal import Decimal

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class LoyaltyReward(models.Model):
    """Nagroda w programie lojalnościowym (np. Kupon 50zł)."""
    name = models.CharField(max_length=200, verbose_name="Nazwa nagrody", default="Nagroda")
    points_required = models.PositiveIntegerField(verbose_name="Wymagane punkty")
    reward_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Wartość nagrody")
    is_percentage = models.BooleanField(default=False, verbose_name="Czy procentowa?")
    description = models.CharField(max_length=255, verbose_name="Opis (dla klienta)")
    active = models.BooleanField(default=True, verbose_name="Aktywna")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia", null=True, blank=True)

    class Meta:
        verbose_name = "Nagroda lojalnościowa"
        verbose_name_plural = "Nagrody lojalnościowe"
        ordering = ['points_required']

    def __str__(self):
        return f"{self.name} ({self.points_required} pkt)"


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

    # Kiedy kupon staje się aktywny
    valid_from = models.DateTimeField(
        default=timezone.now,
        verbose_name="Ważny od"
    )

    # Kiedy kupon wygasa
    valid_to = models.DateTimeField(verbose_name="Ważny do")

    # Wartość zniżki (np. 10 dla 10% lub 100 dla 100 zł)
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Wartość zniżki"
    )

    # Czy zniżka jest procentowa czy kwotowa?
    is_percentage = models.BooleanField(
        default=True,
        verbose_name="Czy zniżka procentowa?"
    )

    # Ile razy kupon może być użyty w sumie
    usage_limit = models.PositiveIntegerField(
        default=1,
        verbose_name="Limit użyć"
    )

    # Ile razy kupon już został użyty
    usage_count = models.PositiveIntegerField(
        default=0,
        editable=False,
        verbose_name="Liczba użyć"
    )

    # Czy kupon jest w ogóle włączony
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
            # Oblicz zniżkę procentową
            discount_amount = (self.value / Decimal(100)) * total_price
        else:
            # Zniżka kwotowa
            discount_amount = self.value

        # Upewnij się, że zniżka nie jest większa niż cena
        discount_amount = min(discount_amount, total_price)

        new_total_price = total_price - discount_amount

        return new_total_price, discount_amount
