# support/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Ticket, TicketMessage
from .serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketCreateSerializer,
    TicketReplySerializer, TicketAdminUpdateSerializer
)
from EStore.permissions import IsAdminUser
from .permissions import IsTicketOwnerOrAdmin


# === API DLA KLIENTA ===

class ClientTicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint dla zalogowanego klienta do zarządzania WŁASNYMI zgłoszeniami.
    """
    permission_classes = [IsAuthenticated]  # Wymaga zalogowania do wszystkich akcji

    def get_queryset(self):
        """
        Klient widzi tylko swoje zgłoszenia.
        """
        return Ticket.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Wybiera odpowiedni serializer w zależności od akcji."""
        if self.action == 'list':
            return TicketListSerializer
        if self.action == 'create':
            return TicketCreateSerializer
        if self.action == 'reply':
            return TicketReplySerializer
        return TicketDetailSerializer  # dla 'retrieve'

    def get_permissions(self):
        """Używa dodatkowych uprawnień dla akcji na konkretnym obiekcie."""
        if self.action in ['retrieve', 'reply']:
            # Sprawdź, czy klient jest właścicielem tego zgłoszenia
            return [IsAuthenticated(), IsTicketOwnerOrAdmin()]
        return super().get_permissions()

    @transaction.atomic
    @transaction.atomic
    def perform_create(self, serializer):
        """
        Tworzy nowe zgłoszenie ORAZ pierwszą wiadomość.
        Nadpisane, aby poprawnie obsłużyć pole 'body'.
        """
        # validated_data z serializera zawiera 'subject' i 'body'
        validated_data = serializer.validated_data

        # 1. Wyciągamy 'body' ze słownika, aby nie trafiło do Ticket.objects.create()
        body = validated_data.pop('body')

        # 2. Tworzymy Ticket używając tylko pozostałych danych (czyli 'subject')
        #    i przypisujemy zalogowanego użytkownika
        ticket = Ticket.objects.create(
            user=self.request.user,
            **validated_data  # To przekaże teraz tylko 'subject'
        )

        # 3. Tworzymy pierwszą wiadomość używając wyciągniętego 'body'
        TicketMessage.objects.create(
            ticket=ticket,
            author=self.request.user,  # Autorem jest klient
            body=body
        )

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """
        Niestandardowa akcja dla klienta do wysłania odpowiedzi.
        POST /api/v1/support/tickets/<id>/reply/
        """
        ticket = self.get_object()  # To automatycznie sprawdza uprawnienia
        serializer = TicketReplySerializer(data=request.data)

        if serializer.is_valid():
            # Stwórz nową wiadomość powiązaną ze zgłoszeniem
            TicketMessage.objects.create(
                ticket=ticket,
                author=request.user,  # Autorem jest klient
                body=serializer.validated_data['body']
            )

            # Zmień status zgłoszenia na "Nowe" (lub "Odpisano")
            ticket.status = Ticket.STATUS_NEW
            ticket.save(update_fields=['status', 'updated_at'])

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Blokujemy domyślne akcje 'update', 'partial_update' i 'destroy' dla klienta
    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


# === API DLA ADMINISTRATORA ===

class AdminTicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint dla administratora do zarządzania WSZYSTKIMI zgłoszeniami.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]  # Wymaga bycia adminem

    def get_queryset(self):
        """
        Admin widzi wszystkie zgłoszenia.
        Może filtrować po statusie, np. /?status=new
        """
        queryset = Ticket.objects.all().prefetch_related('user', 'messages')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def get_serializer_class(self):
        """Wybiera odpowiedni serializer w zależności od akcji."""
        if self.action == 'list':
            return TicketListSerializer
        if self.action in ['update', 'partial_update']:
            return TicketAdminUpdateSerializer  # Tylko zmiana statusu
        if self.action == 'reply':
            return TicketReplySerializer
        return TicketDetailSerializer  # dla 'retrieve'

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """
        Niestandardowa akcja dla admina do wysłania odpowiedzi.
        POST /api/v1/admin/support/tickets/<id>/reply/
        """
        ticket = self.get_object()
        serializer = TicketReplySerializer(data=request.data)

        if serializer.is_valid():
            # Stwórz nową wiadomość
            TicketMessage.objects.create(
                ticket=ticket,
                author=request.user,  # Autorem jest zalogowany admin
                body=serializer.validated_data['body']
            )

            # Zmień status zgłoszenia na "W trakcie" (bo admin odpisał)
            ticket.status = Ticket.STATUS_IN_PROGRESS
            ticket.save(update_fields=['status', 'updated_at'])

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Blokujemy domyślne 'create' dla admina (admin nie tworzy zgłoszeń)
    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
