# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import OrderInvoiceView

app_name = 'orders'

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='order')  # <-- DODAJ TĘ LINIĘ

urlpatterns = [
    path('', include(router.urls)),
    path('reports/sales/', views.SalesStatsView.as_view(), name='sales-stats'),
    path('orders/<int:order_id>/invoice/', OrderInvoiceView.as_view(), name='order-invoice'),
]
