from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, F
from elasticsearch_dsl.query import MultiMatch
from django.shortcuts import get_object_or_404

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


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().annotate(product_count=Count('products'))
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    lookup_field = 'slug'

    def get_object(self):
        """
        Wyszukiwanie kategorii po slugu (z obsługą tłumaczeń).
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        # Jeśli przekazano ID (cyfry), szukaj po ID
        if lookup_value.isdigit():
            obj = get_object_or_404(self.get_queryset(), id=lookup_value)
        else:
            # Jeśli przekazano tekst, szukaj w tłumaczeniach (translations__slug)
            obj = get_object_or_404(self.get_queryset(), translations__slug=lookup_value)

        self.check_object_permissions(self.request, obj)
        return obj


class ProductViewSet(viewsets.ModelViewSet):
    # Dodajemy prefetch_related('translations'), żeby nie zarzynać bazy
    queryset = Product.objects.all().filter(available=True).distinct().prefetch_related('translations', 'variants')
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductFilter
    # Sortowanie też musi być po polu tłumaczenia!
    ordering_fields = ['translations__name', 'created_at', 'variants__price']
    ordering = ['-created_at']
    permission_classes = [IsAdminUserOrReadOnly]

    def get_object(self):
        """
        Wyszukiwanie produktu po slugu w tabeli tłumaczeń.
        """
        # Pobieramy wartość sluga z URL-a
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        # Budujemy zapytanie do bazy: szukamy w translations__slug
        filter_kwargs = {f'translations__slug': lookup_value}

        # Pobieramy obiekt (lub 404)
        obj = get_object_or_404(self.get_queryset(), **filter_kwargs)

        # Sprawdzamy uprawnienia
        self.check_object_permissions(self.request, obj)
        return obj


class ProductAttributeViewSet(viewsets.ModelViewSet):
    queryset = ProductAttribute.objects.all()
    serializer_class = ProductAttributeSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    @action(detail=True, methods=['get'], url_path='values')
    def values(self, request, pk=None):
        """Get all values for this attribute"""
        attribute = self.get_object()
        values = attribute.values.all()
        serializer = AttributeValueSerializer(values, many=True, context={'request': request})
        return Response(serializer.data)


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


@extend_schema(
    parameters=[
        OpenApiParameter(
            name='q',
            description='Fraza wyszukiwania (szuka w nazwie PL/EN, opisie, kategorii i atrybutach)',
            required=True,
            type=OpenApiTypes.STR
        ),
    ]
)
class ProductSearchView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        query_string = self.request.query_params.get('q')
        if not query_string:
            return Product.objects.none()

        search = ProductDocument.search()
        query = MultiMatch(
            query=query_string,
            fields=[
                'name_pl^4',  # Polska nazwa (priorytet)
                'name_en^4',  # Angielska nazwa (priorytet)
                'description_pl',  # Polski opis
                'description_en',  # Angielski opis
                'attributes_flat^2',
                'category^2'
            ],
            fuzziness='AUTO'  # Obsługa literówek
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
            'attributes__attribute', 'images', 'product__translations'
        ).order_by('stock', 'product__translations__name')

        severity = self.request.query_params.get('severity', None)
        if severity == 'critical':
            queryset = queryset.filter(stock=0)
        elif severity == 'warning':
            from django.db.models import ExpressionWrapper, IntegerField
            queryset = queryset.filter(
                stock__gt=0,
                stock__lt=ExpressionWrapper(
                    F('low_stock_threshold') / 2,
                    output_field=IntegerField()
                )
            )

        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def trigger_alert(self, request):
        """
        Ręcznie wyzwala sprawdzenie niskich stanów i wysyła emaile z alertami.
        """
        try:
            result = check_low_stock_levels.delay()
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
        # Warning variants - use ExpressionWrapper for division
        from django.db.models import ExpressionWrapper, IntegerField
        warning_variants = ProductVariant.objects.filter(
            stock__gt=0,
            stock__lt=ExpressionWrapper(
                F('low_stock_threshold') / 2,
                output_field=IntegerField()
            ),
            available=True
        ).count()

        return Response({
            'total_variants': total_variants,
            'low_stock_count': low_stock_variants,
            'critical_count': critical_variants,
            'warning_count': warning_variants,
            'ok_count': total_variants - low_stock_variants
        })
