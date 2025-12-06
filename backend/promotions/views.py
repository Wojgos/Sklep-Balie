import datetime
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from EStore.permissions import IsAdminUser
from users.models import CustomUser as User
from .models import DiscountCoupon, LoyaltyReward, RedeemedReward
from .serializers import DiscountCouponSerializer, LoyaltyRewardSerializer, RedeemRewardInputSerializer


class CouponAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint dla panelu admina do zarządzania kuponami rabatowymi.
    Tylko admin może tworzyć, edytować i widzieć kupony.
    """
    queryset = DiscountCoupon.objects.all()
    serializer_class = DiscountCouponSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


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
    serializer_class = RedeemRewardInputSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reward_id = serializer.validated_data['reward_id']
        user = request.user

        reward = get_object_or_404(LoyaltyReward, id=reward_id, active=True)

        user_locked = User.objects.select_for_update().get(id=user.id)

        if user_locked.loyalty_points < reward.points_required:
            return Response(
                {
                    "error": f"Masz za mało punktów. Wymagane: {reward.points_required}, "
                             f"Posiadane: {user_locked.loyalty_points}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_locked.loyalty_points -= reward.points_required
        user_locked.save(update_fields=['loyalty_points'])

        new_code = f"LOYALTY-{user.id}-{uuid.uuid4().hex[:6].upper()}"
        valid_to_date = timezone.now() + datetime.timedelta(days=90)

        new_coupon = DiscountCoupon.objects.create(
            code=new_code,
            valid_from=timezone.now(),
            valid_to=valid_to_date,
            value=reward.reward_value,
            is_percentage=reward.is_percentage,
            usage_limit=1,
            active=True,
            user=user_locked
        )

        RedeemedReward.objects.create(
            user=user_locked,
            reward=reward,
            reward_name=reward.name,
            points_spent=reward.points_required,
            coupon_code=new_code
        )

        return Response({
            "message": "Punkty wymienione pomyślnie!",
            "coupon_code": new_code,
            "reward_name": reward.name,
            "points_spent": reward.points_required,
            "points_remaining": user_locked.loyalty_points,
            "coupon_details": DiscountCouponSerializer(new_coupon).data
        }, status=status.HTTP_201_CREATED)


class ValidateCouponView(APIView):
    """
    API endpoint do walidacji kuponu i obliczania zniżki przed złożeniem zamówienia.
    
    POST /api/v1/promotions/coupons/validate/
    Body: { "code": "LOYALTY-1-ABC123", "cart_total": 150.00 }
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        code = request.data.get('code', '').strip()
        cart_total = request.data.get('cart_total')

        if not code:
            return Response({"error": "Kod kuponu jest wymagany."}, status=status.HTTP_400_BAD_REQUEST)

        if cart_total is None:
            return Response({"error": "Wartość koszyka (cart_total) jest wymagana."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_total = Decimal(str(cart_total))
        except (InvalidOperation, TypeError, ValueError):
            return Response({"error": "Nieprawidłowa wartość koszyka."}, status=status.HTTP_400_BAD_REQUEST)

        if cart_total < 0:
            return Response({"error": "Wartość koszyka nie może być ujemna."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = DiscountCoupon.objects.get(code=code, active=True)
        except DiscountCoupon.DoesNotExist:
            return Response({"error": "Nieprawidłowy kod kuponu."}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        if coupon.valid_from and now < coupon.valid_from:
            return Response({"error": "Ten kupon jeszcze nie jest aktywny."}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.valid_to and now > coupon.valid_to:
            return Response({"error": "Ten kupon wygasł."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return Response({"error": "Ten kupon został już wykorzystany."}, status=status.HTTP_400_BAD_REQUEST)

        coupon_value = coupon.value if isinstance(coupon.value, Decimal) else Decimal(str(coupon.value))

        if coupon.is_percentage:
            discount_amount = (cart_total * coupon_value) / Decimal('100')
        else:
            discount_amount = coupon_value

        discount_amount = min(discount_amount, cart_total)
        discount_amount = discount_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        final_total = (cart_total - discount_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return Response({
            "valid": True,
            "discount_amount": float(discount_amount),
            "is_percentage": coupon.is_percentage,
            "value": float(coupon_value),
            "final_total": float(final_total)
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
