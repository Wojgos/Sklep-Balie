# support/serializers.py
from rest_framework import serializers
from .models import Ticket, TicketMessage
from users.serializers import UserProfileSerializer  # Użyjemy go, by pokazać autora
from users.models import CustomUser


class TicketMessageSerializer(serializers.ModelSerializer):
    """
    Serializer dla pojedynczej wiadomości w zgłoszeniu.
    """
    # Zamiast pokazywać tylko ID autora, pokażemy jego profil
    author_id = serializers.ReadOnlyField(source='author.id')

    class Meta:
        model = TicketMessage
        fields = ('id', 'author_id', 'body', 'created_at')


class TicketListSerializer(serializers.ModelSerializer):
    """
    Serializer dla listy zgłoszeń (widok uproszczony).
    """

    class Meta:
        model = Ticket
        fields = ('id', 'subject', 'status', 'created_at', 'updated_at')
        read_only_fields = fields


class TicketDetailSerializer(serializers.ModelSerializer):
    """
    Serializer dla szczegółów zgłoszenia (widok pełny).
    Pokazuje wszystkie wiadomości w wątku.
    """
    # Zagnieżdżamy wszystkie wiadomości powiązane z tym zgłoszeniem
    messages = TicketMessageSerializer(many=True, read_only=True)
    user = UserProfileSerializer(read_only=True)
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            'id', 'user', 'subject', 'status',
            'created_at', 'updated_at',
            'messages',  # Lista wiadomości (z author_id)
            'participants'  # Lista profili (do "rozszyfrowania" author_id)
        )
        read_only_fields = fields

    def get_participants(self, obj):
        """
        Funkcja, która zbiera unikalnych autorów
        ze wszystkich wiadomości w tym zgłoszeniu.
        """
        # 'obj' to instancja modelu Ticket

        # 1. Znajdź unikalne ID autorów ze wszystkich wiadomości
        author_ids = obj.messages.values_list('author_id', flat=True).distinct()

        # 2. Pobierz obiekty tych użytkowników z bazy
        authors = CustomUser.objects.filter(id__in=author_ids)

        # 3. Zserializuj ich profile (używając serializera, który już mamy)
        return UserProfileSerializer(authors, many=True).data


# --- Serializery DANYCH WEJŚCIOWYCH ---

class TicketCreateSerializer(serializers.ModelSerializer):
    """
    Serializer używany przez klienta do stworzenia nowego zgłoszenia.
    Oczekuje tematu i treści pierwszej wiadomości.
    """
    # To nie jest pole modelu, ale używamy go do stworzenia pierwszej wiadomości
    body = serializers.CharField(write_only=True)

    class Meta:
        model = Ticket
        fields = ('subject', 'body')


class TicketReplySerializer(serializers.ModelSerializer):
    """
    Serializer używany do wysłania odpowiedzi (przez klienta lub admina).
    Oczekuje tylko treści wiadomości.
    """

    class Meta:
        model = TicketMessage
        fields = ('body',)


class TicketAdminUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer używany przez admina do zmiany statusu zgłoszenia.
    """

    class Meta:
        model = Ticket
        fields = ('status',)
