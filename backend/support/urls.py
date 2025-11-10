# support/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'support'

# Router dla klienta
client_router = DefaultRouter()
client_router.register(r'tickets', views.ClientTicketViewSet, basename='client-ticket')

# Router dla admina
admin_router = DefaultRouter()
admin_router.register(r'tickets', views.AdminTicketViewSet, basename='admin-ticket')

# Główny plik URL tej aplikacji
urlpatterns = [
    # Ścieżki klienta: /api/v1/support/
    path('', include(client_router.urls)),

    # Ścieżki admina: /api/v1/admin/support/
    path('admin/', include(admin_router.urls)),
]