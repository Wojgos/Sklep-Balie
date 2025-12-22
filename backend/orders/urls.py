from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import OrderInvoiceView, StatisticsReportPDFView
from .analytics_views import (
    MonthlyStatisticsView,
    QuarterlyStatisticsView,
    YearlyStatisticsView,
    PeriodComparisonView,
    TopProductsView,
    CategoryPerformanceView,
    DashboardOverviewView,
    MonthlyStatisticsPDFView,
    YearlyStatisticsPDFView,
    CategoryPerformancePDFView,
    TopProductsPDFView,
    DashboardPDFView,
)

app_name = 'orders'

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/sales/', views.SalesStatsView.as_view(), name='sales-stats'),
    path('reports/sales/pdf/', StatisticsReportPDFView.as_view(), name='sales-stats-pdf'),
    path('reports/monthly/', MonthlyStatisticsView.as_view(), name='monthly-stats'),
    path('reports/monthly/pdf/', MonthlyStatisticsPDFView.as_view(), name='monthly-stats-pdf'),
    path('reports/quarterly/', QuarterlyStatisticsView.as_view(), name='quarterly-stats'),
    path('reports/yearly/', YearlyStatisticsView.as_view(), name='yearly-stats'),
    path('reports/yearly/pdf/', YearlyStatisticsPDFView.as_view(), name='yearly-stats-pdf'),
    path('reports/comparison/', PeriodComparisonView.as_view(), name='period-comparison'),
    path('reports/top-products/', TopProductsView.as_view(), name='top-products'),
    path('reports/top-products/pdf/', TopProductsPDFView.as_view(), name='top-products-pdf'),
    path('reports/categories/', CategoryPerformanceView.as_view(), name='category-performance'),
    path('reports/category-performance/pdf/', CategoryPerformancePDFView.as_view(), name='category-performance-pdf'),
    path('reports/dashboard/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('reports/statistics/pdf/', DashboardPDFView.as_view(), name='statistics-pdf'),
    path('orders/<int:order_id>/invoice/', OrderInvoiceView.as_view(), name='order-invoice'),
]
