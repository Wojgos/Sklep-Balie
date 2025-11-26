# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import OrderInvoiceView, StatisticsReportPDFView

app_name = 'orders'

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/sales/', views.SalesStatsView.as_view(), name='sales-stats'),
    path('reports/sales/pdf/', StatisticsReportPDFView.as_view(), name='sales-stats-pdf'),
    path('orders/<int:order_id>/invoice/', OrderInvoiceView.as_view(), name='order-invoice'),
]
