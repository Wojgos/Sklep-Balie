# promotions/views.py
import datetime
import uuid

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from EStore.permissions import IsAdminUser
from users.models import CustomUser as User
from .models import DiscountCoupon, LoyaltyReward
from .serializers import DiscountCouponSerializer, LoyaltyRewardSerializer


class CouponAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint dla panelu admina do zarządzania kuponami rabatowymi.
    Tylko admin może tworzyć, edytować i widzieć kupony.
    """
    queryset = DiscountCoupon.objects.all()
    serializer_class = DiscountCouponSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]  # Tylko dla admina


# LOYALTY_OFFERS = {
#     1: {"points_required": 500, "value": 25, "is_percentage": False, "type": "kwotowy"},
#     2: {"points_required": 1000, "value": 60, "is_percentage": False, "type": "kwotowy"},
#     3: {"points_required": 1500, "value": 10, "is_percentage": True, "type": "procentowy"},
#     4: {"points_required": 2000, "value": 150, "is_percentage": False, "type": "kwotowy"},
#     # Możemy dodać tu w przyszłości np. darmową dostawę
# }

class LoyaltyRewardAdminViewSet(viewsets.ModelViewSet):
    """
    Zarządzanie nagrodami w programie lojalnościowym (CRUD).
    To tutaj Admin dodaje nowe opcje wymiany punktów.
    """
    queryset = LoyaltyReward.objects.all()
    serializer_class = LoyaltyRewardSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class LoyaltyOffersView(APIView):
    """
    API endpoint, który zwraca listę dostępnych ofert
    lojalnościowych do wymiany (F 1.1).

    GET /api/v1/loyalty/offers/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LoyaltyRewardSerializer

    def get_queryset(self):
        # Pobieramy tylko aktywne nagrody z bazy danych, posortowane po koszcie punktowym
        return LoyaltyReward.objects.filter(active=True).order_by('points_required')


class RedeemLoyaltyPointsView(APIView):
    """
    API endpoint dla klienta do wymiany punktów na kupon rabatowy.

    POST /api/v1/loyalty/redeem/
    Body: { "offer_id": 1 }
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        user = request.user
        reward_id = request.data.get('reward_id')

        if not reward_id:
            return Response({"error": "Musisz podać ID nagrody (reward_id)."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Pobierz nagrodę z bazy danych
        reward = get_object_or_404(LoyaltyReward, id=reward_id, active=True)

        # 2. Zablokuj użytkownika do edycji (zapobiega race condition)
        user_locked = User.objects.select_for_update().get(id=user.id)

        # 3. Sprawdź punkty
        if user_locked.loyalty_points < reward.points_required:
            return Response(
                {
                    "error": f"Masz za mało punktów. Wymagane: {reward.points_required}, "
                             f"Posiadane: {user_locked.loyalty_points}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Odejmij punkty
        user_locked.loyalty_points -= reward.points_required
        user_locked.save(update_fields=['loyalty_points'])

        # 5. Wygeneruj kupon na podstawie danych z nagrody
        new_code = f"LOYALTY-{user.id}-{uuid.uuid4().hex[:6].upper()}"
        valid_to_date = timezone.now() + datetime.timedelta(days=90)  # Kupon ważny 90 dni

        new_coupon = DiscountCoupon.objects.create(
            code=new_code,
            valid_from=timezone.now(),
            valid_to=valid_to_date,
            value=reward.reward_value,
            is_percentage=reward.is_percentage,
            usage_limit=1,  # Jednorazowy
            active=True
        )

        # 6. Zwróć kupon
        return Response({
            "message": "Punkty wymienione pomyślnie!",
            "coupon_code": new_code,
            "points_remaining": user_locked.loyalty_points,
            "coupon_details": DiscountCouponSerializer(new_coupon).data
        }, status=status.HTTP_201_CREATED)
