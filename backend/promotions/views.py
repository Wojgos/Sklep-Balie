# promotions/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from EStore.permissions import IsAdminUser
from .models import DiscountCoupon
from .serializers import DiscountCouponSerializer
import uuid
import datetime
from django.utils import timezone
from rest_framework import status
from django.db import transaction
from users.models import CustomUser as User


class CouponAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint dla panelu admina do zarządzania kuponami rabatowymi.
    Tylko admin może tworzyć, edytować i widzieć kupony.
    """
    queryset = DiscountCoupon.objects.all()
    serializer_class = DiscountCouponSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]  # Tylko dla admina


LOYALTY_OFFERS = {
    1: {"points_required": 500, "value": 25, "is_percentage": False, "type": "kwotowy"},
    2: {"points_required": 1000, "value": 60, "is_percentage": False, "type": "kwotowy"},
    3: {"points_required": 1500, "value": 10, "is_percentage": True, "type": "procentowy"},
    4: {"points_required": 2000, "value": 150, "is_percentage": False, "type": "kwotowy"},
    # Możemy dodać tu w przyszłości np. darmową dostawę
}


class LoyaltyOffersView(APIView):
    """
    API endpoint, który zwraca listę dostępnych ofert
    lojalnościowych do wymiany (F 1.1).

    GET /api/v1/loyalty/offers/
    """
    permission_classes = [IsAuthenticated]  # Tylko zalogowany użytkownik może widzieć oferty

    def get(self, request, *args, **kwargs):
        # Formatujemy oferty do ładnego JSON-a
        offer_list = [
            {
                "id": offer_id,
                "points_required": details["points_required"],
                "reward_description": f"Rabat {details['value']} {'%' if details['is_percentage'] else 'zł'}"
            }
            for offer_id, details in LOYALTY_OFFERS.items()
        ]
        return Response(offer_list, status=status.HTTP_200_OK)


class RedeemLoyaltyPointsView(APIView):
    """
    API endpoint dla klienta do wymiany punktów na kupon rabatowy.

    POST /api/v1/loyalty/redeem/
    Body: { "offer_id": 1 }
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic  # Używamy transakcji, aby operacja była bezpieczna
    def post(self, request, *args, **kwargs):
        user = request.user
        offer_id = request.data.get('offer_id')

        # 1. Walidacja oferty
        offer = LOYALTY_OFFERS.get(offer_id)
        if not offer:
            return Response({"error": "Wybrana oferta nie istnieje."}, status=status.HTTP_400_BAD_REQUEST)

        points_required = offer['points_required']

        # 2. Walidacja punktów użytkownika
        # Musimy pobrać użytkownika z blokadą (select_for_update),
        # aby uniknąć podwójnej wymiany tych samych punktów
        user_locked = User.objects.select_for_update().get(id=user.id)

        if user_locked.loyalty_points < points_required:
            return Response({"error": "Masz za mało punktów, aby wymienić tę nagrodę."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 3. Odejmij punkty
        user_locked.loyalty_points -= points_required
        user_locked.save(update_fields=['loyalty_points'])

        # 4. Stwórz nowy kupon rabatowy
        # Generujemy unikalny kod
        new_code = f"LOYALTY-{user.id}-{uuid.uuid4().hex[:8].upper()}"

        # Kupon jest ważny np. przez 30 dni od teraz
        valid_to_date = timezone.now() + datetime.timedelta(days=30)

        new_coupon = DiscountCoupon.objects.create(
            code=new_code,
            valid_from=timezone.now(),
            valid_to=valid_to_date,
            value=offer['value'],
            is_percentage=offer['is_percentage'],
            usage_limit=1,  # Kupon lojalnościowy jest JEDNORAZOWY
            active=True
        )

        # 5. Zwróć nowy kupon użytkownikowi
        # Używamy serializera, który już mamy
        serializer = DiscountCouponSerializer(new_coupon)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
