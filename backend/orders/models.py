from django.db import models
from django.conf import settings
from products.models import ProductVariant  # Upewnij się, że to jest zaimportowane
from promotions.models import DiscountCoupon


class Order(models.Model):
    """Główny model zamówienia."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )

    first_name = models.CharField(max_length=100, verbose_name="Imię")
    last_name = models.CharField(max_length=100, verbose_name="Nazwisko")
    email = models.EmailField(verbose_name="E-mail")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefon")
    address = models.CharField(max_length=250, verbose_name="Adres")
    postal_code = models.CharField(max_length=20, verbose_name="Kod pocztowy")
    city = models.CharField(max_length=100, verbose_name="Miasto")
    notes = models.TextField(blank=True, null=True, verbose_name="Uwagi")

    created_at = models.DateTimeField(auto_now_add=False, default=None, null=True, verbose_name="Utworzono")
    updated_at = models.DateTimeField(auto_now=False, null=True, verbose_name="Zaktualizowano")

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    paid = models.BooleanField(default=False, verbose_name="Opłacone")

    STATUS_CHOICES = [
        ('pending', 'Oczekujące na płatność'),
        ('processing', 'W trakcie realizacji'),
        ('shipped', 'Wysłane'),
        ('completed', 'Zakończone'),
        ('cancelled', 'Anulowane'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Status zamówienia"
    )
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Numer przesyłki"
    )

    coupon = models.ForeignKey(
        DiscountCoupon,
        related_name='orders',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="Użyty kupon"
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name="Kwota rabatu"
    )

    class Meta:
        ordering = ('-created_at',)
        verbose_name = "Zamówienie"
        verbose_name_plural = "Zamówienia"

    def __str__(self):
        return f'Zamówienie {self.id} ({self.status})'


class OrderItem(models.Model):
    """Model przechowujący pojedynczy wariant produktu w ramach zamówienia."""
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )

    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_items'
    )

    product_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f'{self.id} ({self.product_name})'

    def get_cost(self):
        return self.price * self.quantity
