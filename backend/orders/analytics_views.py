"""
Zaawansowane widoki analityczne dla statystyk sprzedażowych.
Zawiera analizy miesięczne, kwartalne, roczne oraz porównania okresów.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth, TruncYear, TruncQuarter
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from EStore.permissions import IsAdminUser
from .models import Order
from .pdf_generator import (
    generate_monthly_statistics_pdf,
    generate_yearly_statistics_pdf,
    generate_category_performance_pdf,
    generate_top_products_pdf,
    generate_statistics_pdf
)


class MonthlyStatisticsView(APIView):
    """
    Statystyki miesięczne - zwraca dane dla każdego miesiąca w podanym zakresie.
    
    GET /api/v1/reports/monthly/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD
    
    Zwraca:
    - przychody miesięczne
    - liczba zamówień miesięcznie
    - średnia wartość zamówienia
    - wzrost/spadek względem poprzedniego miesiąca
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        # Domyślnie ostatnie 12 miesięcy
        if not end_date_str:
            end_date = timezone.now().date()
        else:
            end_date = parse_date(end_date_str)
            
        if not start_date_str:
            start_date = end_date - timedelta(days=365)
        else:
            start_date = parse_date(start_date_str)

        if not start_date or not end_date:
            return Response(
                {"error": "Niepoprawny format daty. Wymagany RRRR-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pobierz dane miesięczne
        monthly_data = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lte=end_date + timedelta(days=1)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            revenue=Sum('total_price'),
            orders_count=Count('id'),
            avg_order_value=Avg('total_price')
        ).order_by('month')

        # Oblicz wzrost/spadek względem poprzedniego miesiąca
        results = []
        prev_revenue = None
        
        for idx, month_data in enumerate(monthly_data):
            revenue = float(month_data['revenue'] or 0)
            
            growth_rate = None
            growth_amount = None
            
            if prev_revenue is not None and prev_revenue > 0:
                growth_amount = revenue - prev_revenue
                growth_rate = ((revenue - prev_revenue) / prev_revenue) * 100
            
            results.append({
                'month': month_data['month'].strftime('%Y-%m'),
                'month_name': month_data['month'].strftime('%B %Y'),
                'revenue': revenue,
                'orders_count': month_data['orders_count'],
                'avg_order_value': float(month_data['avg_order_value'] or 0),
                'growth_rate': round(growth_rate, 2) if growth_rate is not None else None,
                'growth_amount': round(growth_amount, 2) if growth_amount is not None else None,
            })
            
            prev_revenue = revenue

        # Oblicz statystyki całościowe
        total_revenue = sum(r['revenue'] for r in results)
        total_orders = sum(r['orders_count'] for r in results)
        avg_monthly_revenue = total_revenue / len(results) if results else 0

        # Najlepszy i najgorszy miesiąc
        best_month = max(results, key=lambda x: x['revenue']) if results else None
        worst_month = min(results, key=lambda x: x['revenue']) if results else None

        return Response({
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
            },
            'summary': {
                'total_revenue': round(total_revenue, 2),
                'total_orders': total_orders,
                'avg_monthly_revenue': round(avg_monthly_revenue, 2),
                'months_count': len(results),
            },
            'best_month': best_month,
            'worst_month': worst_month,
            'monthly_data': results,
        })


class QuarterlyStatisticsView(APIView):
    """
    Statystyki kwartalne.
    
    GET /api/v1/reports/quarterly/?year=RRRR
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        year_str = request.query_params.get('year')
        
        if year_str:
            try:
                year = int(year_str)
            except ValueError:
                return Response(
                    {"error": "Niepoprawny format roku."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            year = timezone.now().year

        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year, 12, 31).date()

        quarterly_data = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lte=end_date + timedelta(days=1)
        ).annotate(
            quarter=TruncQuarter('created_at')
        ).values('quarter').annotate(
            revenue=Sum('total_price'),
            orders_count=Count('id'),
            avg_order_value=Avg('total_price')
        ).order_by('quarter')

        results = []
        prev_revenue = None
        
        quarter_names = {1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4'}
        
        for quarter_data in quarterly_data:
            revenue = float(quarter_data['revenue'] or 0)
            quarter_num = quarter_data['quarter'].month // 3 + (1 if quarter_data['quarter'].month % 3 else 0)
            
            growth_rate = None
            if prev_revenue is not None and prev_revenue > 0:
                growth_rate = ((revenue - prev_revenue) / prev_revenue) * 100
            
            results.append({
                'quarter': f"{quarter_data['quarter'].year}-{quarter_names.get(quarter_num, 'Q1')}",
                'quarter_name': quarter_names.get(quarter_num, 'Q1'),
                'year': quarter_data['quarter'].year,
                'revenue': revenue,
                'orders_count': quarter_data['orders_count'],
                'avg_order_value': float(quarter_data['avg_order_value'] or 0),
                'growth_rate': round(growth_rate, 2) if growth_rate is not None else None,
            })
            
            prev_revenue = revenue

        return Response({
            'year': year,
            'quarterly_data': results,
        })


class YearlyStatisticsView(APIView):
    """
    Statystyki roczne - porównanie lat.
    
    GET /api/v1/reports/yearly/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Pobierz dane dla ostatnich 5 lat
        current_year = timezone.now().year
        start_year = current_year - 4

        yearly_data = Order.objects.filter(
            paid=True,
            created_at__year__gte=start_year
        ).annotate(
            year=TruncYear('created_at')
        ).values('year').annotate(
            revenue=Sum('total_price'),
            orders_count=Count('id'),
            avg_order_value=Avg('total_price')
        ).order_by('year')

        results = []
        prev_revenue = None
        
        for year_data in yearly_data:
            revenue = float(year_data['revenue'] or 0)
            
            growth_rate = None
            growth_amount = None
            
            if prev_revenue is not None and prev_revenue > 0:
                growth_amount = revenue - prev_revenue
                growth_rate = ((revenue - prev_revenue) / prev_revenue) * 100
            
            results.append({
                'year': year_data['year'].year,
                'revenue': revenue,
                'orders_count': year_data['orders_count'],
                'avg_order_value': float(year_data['avg_order_value'] or 0),
                'growth_rate': round(growth_rate, 2) if growth_rate is not None else None,
                'growth_amount': round(growth_amount, 2) if growth_amount is not None else None,
            })
            
            prev_revenue = revenue

        # Oblicz statystyki całościowe
        total_revenue = sum(r['revenue'] for r in results)
        total_orders = sum(r['orders_count'] for r in results)
        avg_yearly_revenue = total_revenue / len(results) if results else 0

        # Najlepszy i najgorszy rok
        best_year = max(results, key=lambda x: x['revenue']) if results else None
        worst_year = min(results, key=lambda x: x['revenue']) if results else None

        return Response({
            'summary': {
                'total_revenue': round(total_revenue, 2),
                'total_orders': total_orders,
                'avg_yearly_revenue': round(avg_yearly_revenue, 2),
                'years_count': len(results),
            },
            'best_year': best_year,
            'worst_year': worst_year,
            'yearly_data': results,
        })


class PeriodComparisonView(APIView):
    """
    Porównanie dwóch okresów (np. ten miesiąc vs poprzedni, ten rok vs poprzedni).
    
    GET /api/v1/reports/comparison/?
        period1_start=RRRR-MM-DD&period1_end=RRRR-MM-DD&
        period2_start=RRRR-MM-DD&period2_end=RRRR-MM-DD
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        p1_start_str = request.query_params.get('period1_start')
        p1_end_str = request.query_params.get('period1_end')
        p2_start_str = request.query_params.get('period2_start')
        p2_end_str = request.query_params.get('period2_end')

        if not all([p1_start_str, p1_end_str, p2_start_str, p2_end_str]):
            return Response(
                {"error": "Wszystkie parametry dat są wymagane."},
                status=status.HTTP_400_BAD_REQUEST
            )

        p1_start = parse_date(p1_start_str)
        p1_end = parse_date(p1_end_str)
        p2_start = parse_date(p2_start_str)
        p2_end = parse_date(p2_end_str)

        if not all([p1_start, p1_end, p2_start, p2_end]):
            return Response(
                {"error": "Niepoprawny format daty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        def get_period_stats(start, end):
            queryset = Order.objects.filter(
                paid=True,
                created_at__gte=start,
                created_at__lte=end + timedelta(days=1)
            )
            
            stats = queryset.aggregate(
                revenue=Sum('total_price'),
                orders_count=Count('id'),
                avg_order_value=Avg('total_price')
            )
            
            return {
                'revenue': float(stats['revenue'] or 0),
                'orders_count': stats['orders_count'] or 0,
                'avg_order_value': float(stats['avg_order_value'] or 0),
            }

        period1_stats = get_period_stats(p1_start, p1_end)
        period2_stats = get_period_stats(p2_start, p2_end)

        # Oblicz różnice
        revenue_diff = period1_stats['revenue'] - period2_stats['revenue']
        revenue_growth = ((period1_stats['revenue'] - period2_stats['revenue']) / period2_stats['revenue'] * 100) if period2_stats['revenue'] > 0 else 0
        
        orders_diff = period1_stats['orders_count'] - period2_stats['orders_count']
        orders_growth = ((period1_stats['orders_count'] - period2_stats['orders_count']) / period2_stats['orders_count'] * 100) if period2_stats['orders_count'] > 0 else 0

        return Response({
            'period1': {
                'start_date': p1_start_str,
                'end_date': p1_end_str,
                'stats': period1_stats,
            },
            'period2': {
                'start_date': p2_start_str,
                'end_date': p2_end_str,
                'stats': period2_stats,
            },
            'comparison': {
                'revenue_difference': round(revenue_diff, 2),
                'revenue_growth_rate': round(revenue_growth, 2),
                'orders_difference': orders_diff,
                'orders_growth_rate': round(orders_growth, 2),
            }
        })


class TopProductsView(APIView):
    """
    Top produkty w danym okresie.
    
    GET /api/v1/reports/top-products/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD&limit=10
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))

        # Domyślnie ostatnie 30 dni
        if not end_date_str:
            end_date = timezone.now().date()
        else:
            end_date = parse_date(end_date_str)
            
        if not start_date_str:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = parse_date(start_date_str)

        orders = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lte=end_date + timedelta(days=1)
        ).prefetch_related('items__variant__product')

        product_stats = defaultdict(lambda: {
            'quantity': 0,
            'revenue': 0,
            'orders_count': set()
        })

        for order in orders:
            for item in order.items.all():
                if item.variant and item.variant.product:
                    product = item.variant.product
                    product_stats[product.id]['product'] = product
                    product_stats[product.id]['quantity'] += item.quantity
                    product_stats[product.id]['revenue'] += float(item.price) * item.quantity
                    product_stats[product.id]['orders_count'].add(order.id)

        results = []
        for product_id, data in product_stats.items():
            if 'product' in data:
                product = data['product']
                results.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_slug': product.slug,
                    'quantity_sold': data['quantity'],
                    'revenue': round(data['revenue'], 2),
                    'orders_count': len(data['orders_count']),
                    'avg_price': round(data['revenue'] / data['quantity'], 2) if data['quantity'] > 0 else 0,
                })

        # Sortuj po przychodzie
        results.sort(key=lambda x: x['revenue'], reverse=True)

        return Response({
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
            },
            'top_products': results[:limit],
        })


class CategoryPerformanceView(APIView):
    """
    Wydajność kategorii - które kategorie generują najwięcej przychodu.
    
    GET /api/v1/reports/categories/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        # Domyślnie ostatnie 30 dni
        if not end_date_str:
            end_date = timezone.now().date()
        else:
            end_date = parse_date(end_date_str)
            
        if not start_date_str:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = parse_date(start_date_str)

        orders = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lte=end_date + timedelta(days=1)
        ).prefetch_related('items__variant__product__category')

        category_stats = defaultdict(lambda: {
            'quantity': 0,
            'revenue': 0,
            'orders_count': set()
        })

        total_revenue = 0

        for order in orders:
            for item in order.items.all():
                if item.variant and item.variant.product and item.variant.product.category:
                    category = item.variant.product.category
                    revenue = float(item.price) * item.quantity
                    
                    category_stats[category.id]['category'] = category
                    category_stats[category.id]['quantity'] += item.quantity
                    category_stats[category.id]['revenue'] += revenue
                    category_stats[category.id]['orders_count'].add(order.id)
                    
                    total_revenue += revenue

        results = []
        for category_id, data in category_stats.items():
            if 'category' in data:
                category = data['category']
                revenue = data['revenue']
                percentage = (revenue / total_revenue * 100) if total_revenue > 0 else 0
                
                results.append({
                    'category_id': category.id,
                    'category_name': category.name,
                    'quantity_sold': data['quantity'],
                    'revenue': round(revenue, 2),
                    'orders_count': len(data['orders_count']),
                    'revenue_percentage': round(percentage, 2),
                })

        # Sortuj po przychodzie
        results.sort(key=lambda x: x['revenue'], reverse=True)

        # Policz produkty w kategorii (dla każdej kategorii)
        from products.models import Product
        for result in results:
            products_count = Product.objects.filter(
                category_id=result['category_id'],
                available=True
            ).count()
            result['products_count'] = products_count
            result['revenue_share'] = result['revenue_percentage']  # Alias dla spójności

        # Policz unikalne zamówienia
        total_orders = Order.objects.filter(
            paid=True,
            created_at__gte=start_date,
            created_at__lte=end_date + timedelta(days=1)
        ).count()

        return Response({
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
            },
            'summary': {
                'total_revenue': round(total_revenue, 2),
                'active_categories': len(results),
                'total_orders': total_orders,
            },
            'total_revenue': round(total_revenue, 2),
            'categories': results,
        })


class DashboardOverviewView(APIView):
    """
    Kompleksowy widok dashboard z najważniejszymi metrykami.
    
    GET /api/v1/reports/dashboard/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        
        # Dzisiejsze statystyki
        today_stats = Order.objects.filter(
            paid=True,
            created_at__date=today
        ).aggregate(
            revenue=Sum('total_price'),
            orders_count=Count('id')
        )
        
        # Ten miesiąc
        month_start = today.replace(day=1)
        month_stats = Order.objects.filter(
            paid=True,
            created_at__gte=month_start
        ).aggregate(
            revenue=Sum('total_price'),
            orders_count=Count('id')
        )
        
        # Ten rok
        year_start = today.replace(month=1, day=1)
        year_stats = Order.objects.filter(
            paid=True,
            created_at__gte=year_start
        ).aggregate(
            revenue=Sum('total_price'),
            orders_count=Count('id')
        )
        
        # Poprzedni miesiąc dla porównania
        if month_start.month == 1:
            prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
            prev_month_end = month_start - timedelta(days=1)
        else:
            prev_month_start = month_start.replace(month=month_start.month - 1)
            prev_month_end = month_start - timedelta(days=1)
        
        prev_month_stats = Order.objects.filter(
            paid=True,
            created_at__gte=prev_month_start,
            created_at__lte=prev_month_end
        ).aggregate(
            revenue=Sum('total_price'),
            orders_count=Count('id')
        )
        
        # Oblicz wzrost
        current_month_revenue = float(month_stats['revenue'] or 0)
        prev_month_revenue = float(prev_month_stats['revenue'] or 0)
        month_growth = ((current_month_revenue - prev_month_revenue) / prev_month_revenue * 100) if prev_month_revenue > 0 else 0

        return Response({
            'today': {
                'revenue': float(today_stats['revenue'] or 0),
                'orders_count': today_stats['orders_count'] or 0,
            },
            'current_month': {
                'revenue': current_month_revenue,
                'orders_count': month_stats['orders_count'] or 0,
                'growth_rate': round(month_growth, 2),
            },
            'current_year': {
                'revenue': float(year_stats['revenue'] or 0),
                'orders_count': year_stats['orders_count'] or 0,
            },
            'previous_month': {
                'revenue': prev_month_revenue,
                'orders_count': prev_month_stats['orders_count'] or 0,
            }
        })


class MonthlyStatisticsPDFView(APIView):
    """
    Generuje raport PDF dla statystyk miesięcznych.
    GET /api/v1/reports/monthly/pdf/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Użyj tej samej logiki co MonthlyStatisticsView
        monthly_view = MonthlyStatisticsView()
        monthly_view.request = request
        response = monthly_view.get(request)
        
        if response.status_code != 200:
            return response
        
        # Wygeneruj PDF
        try:
            pdf_file = generate_monthly_statistics_pdf(response.data)
            
            http_response = HttpResponse(pdf_file, content_type='application/pdf')
            http_response['Content-Disposition'] = f'attachment; filename="raport_miesięczny_{timezone.now().strftime("%Y%m%d")}.pdf"'
            return http_response
        except Exception as e:
            return Response(
                {"error": f"Błąd generowania PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class YearlyStatisticsPDFView(APIView):
    """
    Generuje raport PDF dla statystyk rocznych.
    GET /api/v1/reports/yearly/pdf/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Użyj tej samej logiki co YearlyStatisticsView
        yearly_view = YearlyStatisticsView()
        yearly_view.request = request
        response = yearly_view.get(request)
        
        if response.status_code != 200:
            return response
        
        # Wygeneruj PDF
        try:
            pdf_file = generate_yearly_statistics_pdf(response.data)
            
            http_response = HttpResponse(pdf_file, content_type='application/pdf')
            http_response['Content-Disposition'] = f'attachment; filename="raport_roczny_{timezone.now().strftime("%Y%m%d")}.pdf"'
            return http_response
        except Exception as e:
            return Response(
                {"error": f"Błąd generowania PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CategoryPerformancePDFView(APIView):
    """
    Generuje raport PDF dla wydajności kategorii.
    GET /api/v1/reports/category-performance/pdf/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Użyj tej samej logiki co CategoryPerformanceView
        category_view = CategoryPerformanceView()
        category_view.request = request
        response = category_view.get(request)
        
        if response.status_code != 200:
            return response
        
        # Wygeneruj PDF
        try:
            pdf_file = generate_category_performance_pdf(response.data)
            
            http_response = HttpResponse(pdf_file, content_type='application/pdf')
            http_response['Content-Disposition'] = f'attachment; filename="raport_kategorii_{timezone.now().strftime("%Y%m%d")}.pdf"'
            return http_response
        except Exception as e:
            return Response(
                {"error": f"Błąd generowania PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TopProductsPDFView(APIView):
    """
    Generuje raport PDF dla top produktów.
    GET /api/v1/reports/top-products/pdf/?start_date=RRRR-MM-DD&end_date=RRRR-MM-DD&limit=10
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Użyj tej samej logiki co TopProductsView
        products_view = TopProductsView()
        products_view.request = request
        response = products_view.get(request)
        
        if response.status_code != 200:
            return response
        
        # Wygeneruj PDF
        try:
            pdf_file = generate_top_products_pdf(response.data)
            
            http_response = HttpResponse(pdf_file, content_type='application/pdf')
            http_response['Content-Disposition'] = f'attachment; filename="raport_top_produkty_{timezone.now().strftime("%Y%m%d")}.pdf"'
            return http_response
        except Exception as e:
            return Response(
                {"error": f"Błąd generowania PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DashboardPDFView(APIView):
    """
    Generuje ogólny raport PDF ze statystykami.
    GET /api/v1/reports/statistics/pdf/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Pobierz dane z różnych widoków
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        
        # Dashboard overview
        dashboard_view = DashboardOverviewView()
        dashboard_view.request = request
        dashboard_data = dashboard_view.get(request).data
        
        # Top products (ostatnie 30 dni)
        top_products_view = TopProductsView()
        top_products_view.request = request
        request.query_params._mutable = True
        request.query_params['start_date'] = thirty_days_ago.strftime('%Y-%m-%d')
        request.query_params['end_date'] = today.strftime('%Y-%m-%d')
        request.query_params['limit'] = '10'
        request.query_params._mutable = False
        top_products_data = top_products_view.get(request).data
        
        # Category performance (ostatnie 30 dni)
        category_view = CategoryPerformanceView()
        category_view.request = request
        category_data = category_view.get(request).data
        
        statistics_data = {
            'dashboard': dashboard_data,
            'top_products': top_products_data,
            'categories': category_data,
            'period': {
                'start_date': thirty_days_ago.strftime('%Y-%m-%d'),
                'end_date': today.strftime('%Y-%m-%d')
            }
        }
        
        # Wygeneruj PDF
        try:
            pdf_file = generate_statistics_pdf(statistics_data)
            
            http_response = HttpResponse(pdf_file, content_type='application/pdf')
            http_response['Content-Disposition'] = f'attachment; filename="raport_statystyki_{timezone.now().strftime("%Y%m%d")}.pdf"'
            return http_response
        except Exception as e:
            return Response(
                {"error": f"Błąd generowania PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
