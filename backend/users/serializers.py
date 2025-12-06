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
        if EmailAddress.objects.filter(email__iexact=email).exists():
            raise ValidationError("A user is already registered with this e-mail address.")
        return email

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.update({
            'first_name': self.validated_data.get('first_name', ''),
            'last_name': self.validated_data.get('last_name', ''),
        })
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer do wyświetlania danych profilu zalogowanego użytkownika,
    w tym punktów lojalnościowych.
    Zwraca zarówno snake_case (dla kompatybilności) jak i camelCase (dla nowych funkcji).
    """
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    loyaltyPoints = serializers.IntegerField(source='loyalty_points', read_only=True)
    isStaff = serializers.BooleanField(source='is_staff', read_only=True)
    isSuperuser = serializers.BooleanField(source='is_superuser', read_only=True)
    dateJoined = serializers.DateTimeField(source='date_joined', read_only=True)
    isActive = serializers.BooleanField(source='is_active', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'loyalty_points',
            'is_staff',
            'is_superuser',
            'date_joined',
            'is_active',
            'firstName',
            'lastName',
            'loyaltyPoints',
            'isStaff',
            'isSuperuser',
            'dateJoined',
            'isActive'
        )
        read_only_fields = fields


class CustomLoginSerializer(LoginSerializer):
    """
    Niestandardowy serializer logowania, który usuwa pole 'username'.
    Logowanie odbywa się tylko przez 'email'.
    """
    username = None
