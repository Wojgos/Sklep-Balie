#!/usr/bin/env python
"""Show available product variants"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from products.models import Product, ProductVariant

print(f'Products: {Product.objects.count()}')
print(f'Variants: {ProductVariant.objects.count()}')
print('\nVariants details:')
for v in ProductVariant.objects.select_related('product')[:15]:
    print(f'  ID: {v.id} | Product: {v.product.name} | Variant: {v.name} | SKU: {v.sku} | Price: {v.price} PLN | Stock: {v.stock}')
