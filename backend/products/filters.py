# products/filters.py
from django_filters import rest_framework as filters
from .models import Product

class ProductFilter(filters.FilterSet):
    price__gt = filters.NumberFilter(
        field_name='variants__price',
        lookup_expr='gt'
    )
    price__lt = filters.NumberFilter(
        field_name='variants__price',
        lookup_expr='lt'
    )
    attributes = filters.AllValuesMultipleFilter(
        field_name='variants__attributes__id',
        label='Filtruj po ID Wartości Atrybutu'
    )

    class Meta:
        model = Product
        fields = {
            'category__slug': ['exact', 'in'],
            'available': ['exact'],
        }