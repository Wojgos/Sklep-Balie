from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('loyalty-points/', views.UserLoyaltyPointsView.as_view(), name='loyalty_points'),
]
