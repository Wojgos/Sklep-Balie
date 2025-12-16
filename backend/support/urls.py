from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'support'

client_router = DefaultRouter()
client_router.register(r'tickets', views.ClientTicketViewSet, basename='client-ticket')

admin_router = DefaultRouter()
admin_router.register(r'tickets', views.AdminTicketViewSet, basename='admin-ticket')

urlpatterns = [
    path('', include(client_router.urls)),
    path('admin/', include(admin_router.urls)),
]
