from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'products'

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'attributes', views.ProductAttributeViewSet, basename='attribute')
router.register(r'variants', views.ProductVariantViewSet, basename='variant')
router.register(r'attribute-values', views.AttributeValueViewSet, basename='attribute-value')
router.register(r'product-images', views.ProductImageViewSet, basename='product-image')
router.register(r'low-stock-variants', views.LowStockVariantsViewSet, basename='low-stock-variant')

urlpatterns = [
    path('', include(router.urls)),
    path('search/', views.ProductSearchView.as_view(), name='product-search'),
]
