from rest_framework import generics, permissions, status
from rest_framework.response import Response
from dj_rest_auth.registration.views import RegisterView
from django.db import transaction
from .serializers import UserProfileSerializer, CustomRegisterSerializer
from .tasks import send_registration_confirmation_email_task


class CustomRegisterView(RegisterView):
    """
    API endpoint do rejestracji.
    Nadpisuje domyślne zachowanie, aby wysyłać e-mail w tle (asynchronicznie).
    """

    # Używa 'CustomRegisterSerializer' (zdefiniowanego w settings.py)

    def perform_create(self, serializer):
        """
        Nadpisuje domyślną metodę.
        Tworzy użytkownika (is_active=True) i zleca wysłanie e-maila.
        """
        # Serializer.save() tworzy użytkownika z domyślnymi ustawieniami
        # (is_active=True), co jest w porządku.
        user = serializer.save(self.request)

        # Zleca zadanie wysłania e-maila do Celery
        try:
            transaction.on_commit(
                lambda: send_registration_confirmation_email_task.delay(user.id)
            )
        except Exception as e:
            print(f"KRYTYCZNY BŁĄD: Nie można było zakolejkować e-maila rejestracyjnego: {e}")

        return user

    def create(self, request, *args, **kwargs):
        """
        Nadpisuje metodę 'create', aby zwrócić poprawną odpowiedź 201.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)

        # Zwracamy prostą odpowiedź
        # Użytkownik jest 'aktywny', ale 'niezweryfikowany',
        # więc nie może się zalogować.
        return Response(
            {"detail": "Konto zostało pomyśtnie utworzone. Sprawdź e-mail, aby aktywować konto."},
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class UserProfileView(generics.RetrieveAPIView):
    """
    API endpoint do pobierania danych zalogowanego użytkownika.
    Wymaga bycia zalogowanym (posiadania ważnego tokenu JWT).

    GET /api/v1/users/profile/
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]  # Tylko dla zalogowanych

    def get_object(self):
        """
        Zwraca obiekt użytkownika, który wysyła to żądanie.
        """
        return self.request.user


class UserLoyaltyPointsView(generics.GenericAPIView):
    """
    API endpoint do pobierania punktów lojalnościowych zalogowanego użytkownika.
    
    GET /api/v1/users/loyalty-points/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            "user_id": user.id,
            "email": user.email,
            "available_points": user.loyalty_points,
            "total_points_earned": user.loyalty_points  # Możesz rozszerzyć o historię
        }, status=status.HTTP_200_OK)
