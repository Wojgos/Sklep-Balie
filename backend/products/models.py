# products/models.py
from django.db import models
from django.utils.text import slugify
from django.conf import settings


# Usuwamy importy parler
# from parler.models import TranslatableModel, TranslatedFields


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nazwa kategorii")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories'
    )

    class Meta:
        verbose_name = "Kategoria"
        verbose_name_plural = "Kategorie"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProductAttribute(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nazwa atrybutu")

    class Meta:
        verbose_name = "Atrybut"
        verbose_name_plural = "Atrybuty"

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    attribute = models.ForeignKey(
        ProductAttribute,
        on_delete=models.CASCADE,
        related_name='values',
        verbose_name="Atrybut"
    )
    value = models.CharField(max_length=100, verbose_name="Wartość")

    class Meta:
        verbose_name = "Wartość atrybutu"
        verbose_name_plural = "Wartości atrybutów"
        unique_together = ('attribute', 'value')

    def __str__(self):
        return f'{self.attribute.name}: {self.value}'


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
        verbose_name="Kategoria"
    )
    name = models.CharField(max_length=255, verbose_name="Nazwa produktu")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, verbose_name="Opis")
    available = models.BooleanField(default=True, verbose_name="Dostępny")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Produkt (Matka)"
        verbose_name_plural = "Produkty (Matki)"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants',
        verbose_name="Produkt Matka"
    )
    name = models.CharField(max_length=255, blank=True, verbose_name="Nazwa wariantu")
    sku = models.CharField(max_length=100, unique=True, verbose_name="SKU")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Cena"
    )
    stock = models.PositiveIntegerField(default=0, verbose_name="Stan magazynowy")
    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        verbose_name="Próg alertu niskiego stanu"
    )
    attributes = models.ManyToManyField(
        AttributeValue,
        related_name='variants',
        verbose_name="Atrybuty"
    )
    available = models.BooleanField(default=True, verbose_name="Dostępny")

    class Meta:
        verbose_name = "Wariant produktu"
        verbose_name_plural = "Warianty produktów"

    def __str__(self):
        if self.name:
            return f'{self.product.name} ({self.name})'

        attr_str = ", ".join(str(attr) for attr in self.attributes.all())
        if attr_str:
            return f'{self.product.name} ({attr_str})'

        return f'{self.product.name} (Wariant {self.id})'

    def save(self, *args, **kwargs):
        if not self.name and self.pk:  # Sprawdź 'pk', aby upewnić się, że atrybuty mogą być dodane
            attrs = self.attributes.all().order_by('attribute__name')
            self.name = ", ".join(str(attr.value) for attr in attrs)
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    image = models.ImageField(
        upload_to='product_images/%Y/%m/%d/',
        verbose_name="Zdjęcie"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="Produkt Matka",
        null=True, blank=True
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="Wariant",
        null=True, blank=True
    )
    alt_text = models.CharField(max_length=255, blank=True, verbose_name="Tekst alternatywny")
    is_main = models.BooleanField(default=False, verbose_name="Zdjęcie główne")

    class Meta:
        verbose_name = "Zdjęcie produktu"
        verbose_name_plural = "Zdjęcia produktów"

    def __str__(self):
        return self.alt_text or f"Zdjęcie dla {self.product or self.variant}"