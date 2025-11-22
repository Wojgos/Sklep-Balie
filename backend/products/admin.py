from django.contrib import admin
from .models import Category, Product, ProductAttribute, AttributeValue, ProductVariant


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ('attribute', 'value')
    list_filter = ('attribute',)
    search_fields = ('value',)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    fields = ('name', 'sku', 'price', 'stock', 'available', 'attributes')
    extra = 1
    filter_horizontal = ('attributes',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'category', 'available', 'created_at']
    list_filter = ['available', 'created_at', 'category']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    inlines = [ProductVariantInline]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'product', 'sku', 'price', 'stock', 'available')
    list_filter = ('product', 'available')
    search_fields = ('sku', 'name', 'product__name')
    list_editable = ('price', 'stock', 'available')
    filter_horizontal = ('attributes',)