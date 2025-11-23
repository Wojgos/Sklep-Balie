# products/views.py
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, F
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
from .tasks import check_low_stock_levels


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


class LowStockVariantsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet zwracający warianty produktów z niskim stanem magazynowym.
    Dostępny tylko dla administratorów.
    """
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Zwraca warianty, których stan magazynowy jest poniżej progu alarmowego.
        Sortuje według stanu magazynowego (od najniższego).
        """
        queryset = ProductVariant.objects.filter(
            stock__lt=F('low_stock_threshold'),
            available=True
        ).select_related('product', 'product__category').prefetch_related(
            'attributes__attribute', 'images'
        ).order_by('stock', 'product__name')
        
        # Opcjonalny parametr severity (krytyczny, ostrzeżenie, wszystkie)
        severity = self.request.query_params.get('severity', None)
        if severity == 'critical':
            queryset = queryset.filter(stock=0)
        elif severity == 'warning':
            # Stock > 0 ale mniej niż połowa progu
            queryset = queryset.filter(
                stock__gt=0,
                stock__lt=F('low_stock_threshold') / 2
            )
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def trigger_alert(self, request):
        """
        Ręcznie wyzwala sprawdzenie niskich stanów i wysyła emaile z alertami.
        """
        try:
            result = check_low_stock_levels.delay()
            # Czekamy na wynik (maksymalnie 30 sekund)
            message = result.get(timeout=30)
            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Błąd podczas wyzwalania alertu: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def statistics(self, request):
        """
        Zwraca statystyki dotyczące niskich stanów magazynowych.
        """
        total_variants = ProductVariant.objects.filter(available=True).count()
        low_stock_variants = ProductVariant.objects.filter(
            stock__lt=F('low_stock_threshold'),
            available=True
        ).count()
        critical_variants = ProductVariant.objects.filter(
            stock=0,
            available=True
        ).count()
        warning_variants = ProductVariant.objects.filter(
            stock__gt=0,
            stock__lt=F('low_stock_threshold') / 2,
            available=True
        ).count()
        
        return Response({
            'total_variants': total_variants,
            'low_stock_count': low_stock_variants,
            'critical_count': critical_variants,
            'warning_count': warning_variants,
            'ok_count': total_variants - low_stock_variants
        })