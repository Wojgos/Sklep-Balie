from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Endpoint do profilu użytkownika
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    # Endpoint do punktów lojalnościowych
    path('loyalty-points/', views.UserLoyaltyPointsView.as_view(), name='loyalty_points'),
]
