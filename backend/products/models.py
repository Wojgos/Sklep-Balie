from django.db import models
from django.utils.text import slugify
from parler.models import TranslatableModel, TranslatedFields


class Category(TranslatableModel):
    """Kategoria produktu"""
    image = models.ImageField(
        upload_to='category_images/',
        blank=True,
        null=True,
        verbose_name="Zdjęcie kategorii"
    )

    translations = TranslatedFields(
        name=models.CharField(max_length=255, verbose_name="Nazwa kategorii"),
        slug=models.SlugField(max_length=255, unique=True, blank=True),
        description=models.TextField(blank=True, verbose_name="Opis kategorii")
    )

    class Meta:
        verbose_name = "Kategoria"
        verbose_name_plural = "Kategorie"

    def __str__(self):
        return self.safe_translation_getter('name', any_language=True) or f"Kategoria {self.id}"


class ProductAttribute(TranslatableModel):
    """Typ atrybutu, np. Kolor, Materiał"""
    translations = TranslatedFields(
        name=models.CharField(max_length=100, verbose_name="Nazwa atrybutu")
    )

    class Meta:
        verbose_name = "Atrybut"
        verbose_name_plural = "Atrybuty"

    def __str__(self):
        return self.safe_translation_getter('name', any_language=True) or f"Atrybut {self.id}"


class AttributeValue(TranslatableModel):
    """Wartość atrybutu, np. Czerwony, Drewno"""
    attribute = models.ForeignKey(
        ProductAttribute, on_delete=models.CASCADE, related_name='values', verbose_name="Atrybut"
    )

    translations = TranslatedFields(
        value=models.CharField(max_length=100, verbose_name="Wartość")
    )

    class Meta:
        verbose_name = "Wartość atrybutu"
        verbose_name_plural = "Wartości atrybutów"

    def __str__(self):
        attr_name = self.attribute.safe_translation_getter('name', any_language=True)
        val_name = self.safe_translation_getter('value', any_language=True)
        return f'{attr_name}: {val_name}'


class Product(TranslatableModel):
    """Produkt Matka"""
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='products', verbose_name="Kategoria"
    )
    # Pola nietłumaczone (wspólne)
    available = models.BooleanField(default=True, verbose_name="Dostępny")
    attributes_config = models.JSONField(default=dict, blank=True, verbose_name="Konfiguracja atrybutów")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Pola tłumaczone
    translations = TranslatedFields(
        name=models.CharField(max_length=255, verbose_name="Nazwa produktu"),
        slug=models.SlugField(max_length=255, unique=True, blank=True),
        description=models.TextField(blank=True, verbose_name="Opis")
    )

    class Meta:
        verbose_name = "Produkt (Matka)"
        verbose_name_plural = "Produkty (Matki)"

    def __str__(self):
        return self.safe_translation_getter('name', any_language=True) or f"Produkt {self.id}"


class ProductVariant(TranslatableModel):
    """Wariant Produktu (SKU)"""
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='variants', verbose_name="Produkt Matka"
    )
    sku = models.CharField(max_length=100, unique=True, verbose_name="SKU")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Cena")
    stock = models.PositiveIntegerField(default=0, verbose_name="Stan magazynowy")
    low_stock_threshold = models.PositiveIntegerField(default=5, verbose_name="Próg alertu")
    attributes = models.ManyToManyField(AttributeValue, related_name='variants', verbose_name="Atrybuty")
    available = models.BooleanField(default=True, verbose_name="Dostępny")

    translations = TranslatedFields(
        name=models.CharField(max_length=255, blank=True, verbose_name="Nazwa wariantu")
    )

    class Meta:
        verbose_name = "Wariant produktu"
        verbose_name_plural = "Warianty produktów"

    def __str__(self):
        p_name = self.product.safe_translation_getter('name', any_language=True)
        v_name = self.safe_translation_getter('name', any_language=True)
        return f'{p_name} ({v_name or self.sku})'


class ProductImage(TranslatableModel):
    """Zdjęcie produktu"""
    image = models.ImageField(upload_to='product_images/%Y/%m/%d/', verbose_name="Zdjęcie")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='images', null=True, blank=True)
    is_main = models.BooleanField(default=False, verbose_name="Zdjęcie główne")

    translations = TranslatedFields(
        alt_text=models.CharField(max_length=255, blank=True, verbose_name="Tekst alternatywny")
    )

    class Meta:
        verbose_name = "Zdjęcie produktu"
        verbose_name_plural = "Zdjęcia produktów"

    def __str__(self):
        return self.safe_translation_getter('alt_text', any_language=True) or f"Zdjęcie {self.id}"
