# promotions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'promotions'

router = DefaultRouter()
router.register(r'coupons', views.CouponAdminViewSet, basename='coupon')

urlpatterns = [
    path('', include(router.urls)),
    path('loyalty/offers/', views.LoyaltyOffersView.as_view(), name='loyalty-offers'),
    path('loyalty/redeem/', views.RedeemLoyaltyPointsView.as_view(), name='loyalty-redeem'),
]
