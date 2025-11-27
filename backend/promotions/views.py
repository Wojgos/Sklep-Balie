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

    def get(self, request, *args, **kwargs):
        rewards = LoyaltyReward.objects.filter(active=True).order_by('points_required')
        serializer = LoyaltyRewardSerializer(rewards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

        # 6. Zapisz historię realizacji nagrody
        from .models import RedeemedReward
        RedeemedReward.objects.create(
            user=user_locked,
            reward=reward,
            reward_name=reward.name,
            points_spent=reward.points_required,
            coupon_code=new_code
        )

        # 7. Zwróć kupon
        return Response({
            "message": "Punkty wymienione pomyślnie!",
            "coupon_code": new_code,
            "points_spent": reward.points_required,
            "reward_name": reward.name,
            "points_remaining": user_locked.loyalty_points,
            "coupon_details": DiscountCouponSerializer(new_coupon).data
        }, status=status.HTTP_201_CREATED)


class ValidateCouponView(APIView):
    """
    API endpoint do walidacji kuponu i obliczania zniżki przed złożeniem zamówienia.
    
    POST /api/v1/promotions/coupons/validate/
    Body: { "code": "LOYALTY-1-ABC123", "cart_total": 150.00 }
    """
    permission_classes = []  # Allow anyone to validate coupons

    def post(self, request, *args, **kwargs):
        code = request.data.get('code', '').strip()
        cart_total = request.data.get('cart_total')

        if not code:
            return Response({"error": "Kod kuponu jest wymagany."}, status=status.HTTP_400_BAD_REQUEST)

        if cart_total is None:
            return Response({"error": "Wartość koszyka (cart_total) jest wymagana."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_total = float(cart_total)
        except (ValueError, TypeError):
            return Response({"error": "Nieprawidłowa wartość koszyka."}, status=status.HTTP_400_BAD_REQUEST)

        # Znajdź kupon
        try:
            coupon = DiscountCoupon.objects.get(code=code, active=True)
        except DiscountCoupon.DoesNotExist:
            return Response({"error": "Nieprawidłowy kod kuponu."}, status=status.HTTP_404_NOT_FOUND)

        # Sprawdź ważność czasową
        now = timezone.now()
        if coupon.valid_from and now < coupon.valid_from:
            return Response({"error": "Ten kupon jeszcze nie jest aktywny."}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.valid_to and now > coupon.valid_to:
            return Response({"error": "Ten kupon wygasł."}, status=status.HTTP_400_BAD_REQUEST)

        # Sprawdź limit użyć
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return Response({"error": "Ten kupon został już wykorzystany."}, status=status.HTTP_400_BAD_REQUEST)

        # Oblicz zniżkę
        if coupon.is_percentage:
            discount_amount = (cart_total * coupon.value) / 100
        else:
            discount_amount = coupon.value

        # Upewnij się, że zniżka nie przekracza wartości koszyka
        discount_amount = min(discount_amount, cart_total)

        return Response({
            "valid": True,
            "discount_amount": round(discount_amount, 2),
            "is_percentage": coupon.is_percentage,
            "value": coupon.value,
            "final_total": round(cart_total - discount_amount, 2)
        }, status=status.HTTP_200_OK)


class MyRedeemedRewardsView(APIView):
    """
    API endpoint do pobierania historii zrealizowanych nagród użytkownika.
    
    GET /api/v1/promotions/loyalty/my-rewards/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import RedeemedReward
        from .serializers import RedeemedRewardSerializer
        
        redeemed_rewards = RedeemedReward.objects.filter(user=request.user)
        serializer = RedeemedRewardSerializer(redeemed_rewards, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
