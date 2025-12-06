from django.db import transaction
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDay
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.shortcuts import get_object_or_404
from django.http import HttpResponse


from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from EStore.permissions import IsAdminUser
from EStore.permissions import IsOrderOwnerOrAdmin

from decimal import Decimal
from products.models import ProductVariant
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderAdminUpdateSerializer, OrderResponseSerializer
from .pdf_generator import generate_invoice_pdf
from .tasks import send_invoice_email_task
from promotions.models import DiscountCoupon


class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint do tworzenia i przeglądania zamówień.
    - Klient może tworzyć (POST) i widzieć swoje (GET).
    - Admin może widzieć wszystkie (GET) i aktualizować (PUT/PATCH).
    """

    queryset = Order.objects.all().prefetch_related('items', 'user')

    def get_serializer_class(self):
        """Zwraca inny serializer w zależności od akcji."""
        if self.action == 'create':
            return OrderCreateSerializer

        if self.action in ['update', 'partial_update']:
            return OrderAdminUpdateSerializer

        return OrderResponseSerializer

    def get_permissions(self):
        """Zwraca inne uprawnienia w zależności od akcji."""

        if self.action == 'create':
            return []

        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsAdminUser()]

        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Zwraca inny queryset w zależności od użytkownika.
        Admin widzi wszystko, klient tylko swoje.
        """
        user = self.request.user

        if not user.is_authenticated:
            return Order.objects.none()

        if user.is_staff:
            return Order.objects.all().prefetch_related('items', 'user')

        return Order.objects.filter(user=user).prefetch_related('items', 'user')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        items_data = validated_data.pop('items')

        coupon_code = validated_data.pop('coupon_code', None)

        if not items_data:
            return Response(
                {"error": "Koszyk nie może być pusty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        price_before_discount = Decimal('0.00')
        variants_to_update = []
        order_items_to_create = []

        for item_data in items_data:
            variant_id = item_data['variant_id']
            quantity = item_data['quantity']

            try:
                variant = ProductVariant.objects.select_for_update().get(
                    id=variant_id, available=True
                )
            except ProductVariant.DoesNotExist:
                return Response(
                    {"error": f"Produkt o ID {variant_id} nie istnieje lub jest niedostępny."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if variant.stock < quantity:
                return Response(
                    {"error": f"Niewystarczający stan magazynowy dla {variant.name}. Dostępne: {variant.stock} szt."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            price_before_discount += (variant.price * quantity)

            variant.stock -= quantity
            variants_to_update.append(variant)

            order_items_to_create.append(
                OrderItem(
                    variant=variant,
                    product_name=str(variant),
                    price=variant.price,
                    quantity=quantity
                )
            )

        coupon_obj = None
        discount_amount = Decimal('0.00')
        final_total_price = price_before_discount

        if coupon_code:
            try:
                coupon_obj = DiscountCoupon.objects.get(code__iexact=coupon_code)

                is_valid, error_message = coupon_obj.is_valid()
                if not is_valid:
                    return Response(
                        {"error": error_message},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                final_total_price, discount_amount = coupon_obj.apply_discount(
                    price_before_discount
                )

            except DiscountCoupon.DoesNotExist:
                return Response(
                    {"error": "Podany kod kuponu nie istnieje."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        user = request.user if request.user.is_authenticated else None

        order = Order.objects.create(
            user=user,
            total_price=final_total_price,
            discount_amount=discount_amount,
            coupon=coupon_obj,
            **validated_data
        )

        for item in order_items_to_create:
            item.order = order

        OrderItem.objects.bulk_create(order_items_to_create)

        ProductVariant.objects.bulk_update(variants_to_update, ['stock'])

        if coupon_obj:
            coupon_obj.usage_count = F('usage_count') + 1
            coupon_obj.save(update_fields=['usage_count'])

        if user:
            try:
                points_to_add = int(final_total_price // 10)  # 1 pkt za 10 PLN
                if points_to_add > 0:
                    user.loyalty_points = F('loyalty_points') + points_to_add
                    user.save(update_fields=['loyalty_points'])
            except Exception as e:
                print(f"KRYTYCZNY BŁĄD: Nie można było przyznać punktów lojalnościowych: {e}")

        try:
            transaction.on_commit(lambda: send_invoice_email_task.delay(order.id))
        except Exception as e:
            print(f"KRYTYCZNY BŁĄD: Nie można było zakolejkować zadania Celery: {e}")

        response_serializer = OrderResponseSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class SalesStatsView(APIView):
    """
    API endpoint do pobierania statystyk sprzedażowych.
    Wymaga uprawnień administratora (is_staff=True).

    GET /api/v1/reports/sales/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response(
                {"error": "Parametry 'start_date' i 'end_date' są wymagane (RRRR-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)

        if not start_date or not end_date:
            return Response(
                {"error": "Niepoprawny format daty. Wymagany RRRR-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from datetime import timedelta
        queryset = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lt=end_date + timedelta(days=1)
        )

        total_stats = queryset.aggregate(
            total_revenue=Sum('total_price'),
            total_orders=Count('id')
        )

        daily_sales = queryset.annotate(
            day=TruncDay('created_at')
        ).values(
            'day'
        ).annotate(
            daily_revenue=Sum('total_price'),
            orders_count=Count('id')
        ).order_by('day')

        response_data = {
            'period': {
                'start_date': start_date_str,
                'end_date': end_date_str,
            },
            'summary': {
                'total_revenue': total_stats['total_revenue'] or 0,
                'total_orders': total_stats['total_orders'] or 0,
            },
            'by_day': list(daily_sales)
        }

        return Response(response_data, status=status.HTTP_200_OK)


class OrderInvoiceView(APIView):
    """
    API endpoint do pobierania faktury/potwierdzenia PDF
    dla konkretnego zamówienia.

    GET /api/v1/orders/<id>/invoice/
    """
    permission_classes = [IsAuthenticated, IsOrderOwnerOrAdmin]

    def get(self, request, order_id, *args, **kwargs):
        order = get_object_or_404(Order, id=order_id)

        self.check_object_permissions(request, order)

        try:
            pdf_data = generate_invoice_pdf(order)

            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="zamowienie_{order.id}.pdf"'

            return response

        except Exception as e:
            print(f"Błąd generowania PDF: {e}")
            return Response(
                {"error": "Wystąpił błąd podczas generowania pliku PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StatisticsReportPDFView(APIView):
    """
    API endpoint do pobierania raportu statystyk sprzedażowych w formacie PDF.
    Wymaga uprawnień administratora (is_staff=True).

    GET /api/v1/reports/sales/pdf/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, *args, **kwargs):
        from .pdf_generator import generate_statistics_pdf
        from products.models import Product, Category
        
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response(
                {"error": "Parametry 'start_date' i 'end_date' są wymagane (RRRR-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)

        if not start_date or not end_date:
            return Response(
                {"error": "Niepoprawny format daty. Wymagany RRRR-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from datetime import timedelta
        queryset = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lt=end_date + timedelta(days=1)
        )

        total_stats = queryset.aggregate(
            total_revenue=Sum('total_price'),
            total_orders=Count('id')
        )

        total_revenue = float(total_stats['total_revenue'] or 0)
        total_orders = total_stats['total_orders'] or 0
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0

        from collections import defaultdict
        product_stats = defaultdict(lambda: {'quantity': 0, 'revenue': 0})
        
        for order in queryset.prefetch_related('items__variant__product'):
            for item in order.items.all():
                if item.variant and item.variant.product:
                    product_id = item.variant.product.id
                    product_stats[product_id]['quantity'] += item.quantity
                    product_stats[product_id]['revenue'] += float(item.price) * item.quantity
                    if 'product' not in product_stats[product_id]:
                        product_stats[product_id]['product'] = item.variant.product

        top_products = sorted(
            [{'product': data['product'], 'quantity': data['quantity'], 'revenue': data['revenue']}
             for data in product_stats.values() if 'product' in data],
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]

        category_stats = defaultdict(lambda: {'revenue': 0})
        
        for order in queryset.prefetch_related('items__variant__product__category'):
            for item in order.items.all():
                if item.variant and item.variant.product and item.variant.product.category:
                    category = item.variant.product.category
                    category_stats[category.id]['revenue'] += float(item.price) * item.quantity
                    if 'category' not in category_stats[category.id]:
                        category_stats[category.id]['category'] = category

        revenue_by_category = sorted(
            [{'category': data['category'], 'revenue': data['revenue']}
             for data in category_stats.values() if 'category' in data],
            key=lambda x: x['revenue'],
            reverse=True
        )

        STATUS_CHOICES = {
            'pending': 'Oczekujące',
            'processing': 'Przetwarzane',
            'shipped': 'Wysłane',
            'delivered': 'Dostarczone',
            'cancelled': 'Anulowane'
        }
        
        orders_by_status = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        orders_by_status_list = [
            {
                'status': item['status'],
                'status_display': STATUS_CHOICES.get(item['status'], item['status']),
                'count': item['count']
            }
            for item in orders_by_status
        ]

        statistics_data = {
            'period': {
                'start_date': start_date_str,
                'end_date': end_date_str,
            },
            'summary': {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'average_order_value': average_order_value,
            },
            'top_products': top_products,
            'revenue_by_category': revenue_by_category,
            'orders_by_status': orders_by_status_list,
        }

        try:
            pdf_data = generate_statistics_pdf(statistics_data)

            response = HttpResponse(pdf_data, content_type='application/pdf')
            filename = f'raport_statystyk_{start_date_str}_{end_date_str}.pdf'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            return response

        except Exception as e:
            print(f"Błąd generowania PDF statystyk: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "Wystąpił błąd podczas generowania raportu PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
