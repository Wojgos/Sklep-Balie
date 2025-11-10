from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from dj_rest_auth.registration.serializers import RegisterSerializer
from allauth.account.models import EmailAddress
from .models import CustomUser
from dj_rest_auth.serializers import LoginSerializer


class CustomRegisterSerializer(RegisterSerializer):
    """
    Rozszerza domyślny serializer rejestracji, aby akceptować
    first_name i last_name.
    """
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)

    def validate_email(self, email):
        """
        Nadpisujemy metodę walidacji pola 'email'.
        """
        # Sprawdzamy, czy ten e-mail (bez względu na wielkość liter)
        # istnieje już w tabeli EmailAddress.
        if EmailAddress.objects.filter(email__iexact=email).exists():
            # Jeśli tak, natychmiast przerwij walidację i zwróć błąd 400
            raise ValidationError("A user is already registered with this e-mail address.")

        # Jeśli e-mail jest wolny, przekaż go do dalszej,
        # domyślnej walidacji (np. sprawdzania formatu)
        return email

    def get_cleaned_data(self):
        # Pobierz standardowe dane (email, hasło1, hasło2)
        data = super().get_cleaned_data()
        # Dodaj nasze nowe pola
        data.update({
            'first_name': self.validated_data.get('first_name', ''),
            'last_name': self.validated_data.get('last_name', ''),
        })
        return data

    def save(self, request):
        # Standardowa metoda 'save' tworzy użytkownika
        user = super().save(request)
        # Aktualizujemy użytkownika o dodatkowe dane
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer do wyświetlania danych profilu zalogowanego użytkownika,
    w tym punktów lojalnościowych.
    """

    class Meta:
        model = CustomUser
        # Pola, które zobaczy użytkownik
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'loyalty_points'
        )
        # Endpoint będzie tylko do odczytu
        read_only_fields = fields


class CustomLoginSerializer(LoginSerializer):
    """
    Niestandardowy serializer logowania, który usuwa pole 'username'.
    Logowanie odbywa się tylko przez 'email'.
    """
    username = None
