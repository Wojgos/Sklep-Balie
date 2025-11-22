# products/views.py
from rest_framework import viewsets, generics
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from elasticsearch_dsl.query import MultiMatch

from EStore.permissions import IsAdminUserOrReadOnly
from .documents import ProductDocument
from .filters import ProductFilter
from .models import (
    Product, Category, ProductAttribute, ProductVariant,
    AttributeValue, ProductImage
)
from .serializers import (
    ProductSerializer, CategorySerializer, ProductAttributeSerializer,
    ProductVariantSerializer, AttributeValueSerializer, ProductImageSerializer
)


# Usuwamy 'TranslatableModelViewSet'
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().annotate(product_count=Count('products'))
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    
    def get_object(self):
        """
        Obsługa zarówno ID jak i slug dla elastyczności.
        """
        lookup_value = self.kwargs.get(self.lookup_field)
        if lookup_value.isdigit():
            # Jeśli to liczba, szukaj po ID
            return Category.objects.annotate(product_count=Count('products')).get(id=lookup_value)
        else:
            # Jeśli nie, szukaj po slug
            return Category.objects.annotate(product_count=Count('products')).get(slug=lookup_value)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().filter(available=True).distinct()
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductFilter
    ordering_fields = ['name', 'created_at', 'variants__price']
    ordering = ['-created_at']
    permission_classes = [IsAdminUserOrReadOnly]


class ProductAttributeViewSet(viewsets.ModelViewSet):
    queryset = ProductAttribute.objects.all()
    serializer_class = ProductAttributeSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class AttributeValueViewSet(viewsets.ModelViewSet):
    queryset = AttributeValue.objects.all()
    serializer_class = AttributeValueSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all().filter(available=True)
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ProductSearchView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        query_string = self.request.query_params.get('q')
        if not query_string:
            return Product.objects.none()

        search = ProductDocument.search()
        query = MultiMatch(
            query=query_string,
            fields=['name^3', 'description', 'category', 'attributes_flat^2'],
            fuzziness='AUTO'
        )
        search = search.query(query)
        return search.to_queryset()