from rest_framework import serializers
from .models import Ticket, TicketMessage
from users.serializers import UserProfileSerializer
from users.models import CustomUser


class TicketMessageSerializer(serializers.ModelSerializer):
    """
    Serializer dla pojedynczej wiadomości w zgłoszeniu.
    """
    author_id = serializers.ReadOnlyField(source='author.id')

    class Meta:
        model = TicketMessage
        fields = ('id', 'author_id', 'body', 'created_at')


class TicketListSerializer(serializers.ModelSerializer):
    """
    Serializer dla listy zgłoszeń (widok uproszczony).
    """
    user = UserProfileSerializer(read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ('id', 'subject', 'status', 'created_at', 'updated_at', 'user', 'message_count')
        read_only_fields = fields

    def get_message_count(self, obj):
        """Zwraca liczbę wiadomości w zgłoszeniu."""
        return obj.messages.count()


class TicketDetailSerializer(serializers.ModelSerializer):
    """
    Serializer dla szczegółów zgłoszenia (widok pełny).
    Pokazuje wszystkie wiadomości w wątku.
    """
    messages = TicketMessageSerializer(many=True, read_only=True)
    user = UserProfileSerializer(read_only=True)
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            'id', 'user', 'subject', 'status',
            'created_at', 'updated_at',
            'messages',
            'participants'
        )
        read_only_fields = fields

    def get_participants(self, obj):
        """
        Funkcja, która zbiera unikalnych autorów
        ze wszystkich wiadomości w tym zgłoszeniu.
        """

        author_ids = obj.messages.values_list('author_id', flat=True).distinct()

        authors = CustomUser.objects.filter(id__in=author_ids)

        return UserProfileSerializer(authors, many=True).data


# --- Serializery DANYCH WEJŚCIOWYCH ---

class TicketCreateSerializer(serializers.ModelSerializer):
    """
    Serializer używany przez klienta do stworzenia nowego zgłoszenia.
    Oczekuje tematu i treści pierwszej wiadomości.
    """
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
