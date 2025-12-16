from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from EStore.permissions import IsAdminUser
from .models import Ticket, TicketMessage
from .permissions import IsTicketOwnerOrAdmin
from .serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketCreateSerializer,
    TicketReplySerializer, TicketAdminUpdateSerializer
)


# === API DLA KLIENTA ===

class ClientTicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint dla zalogowanego klienta do zarządzania WŁASNYMI zgłoszeniami.
    """
    permission_classes = [IsAuthenticated]

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
        return TicketDetailSerializer

    def get_permissions(self):
        """Używa dodatkowych uprawnień dla akcji na konkretnym obiekcie."""
        if self.action in ['retrieve', 'reply']:
            return [IsAuthenticated(), IsTicketOwnerOrAdmin()]
        return super().get_permissions()

    @transaction.atomic
    @transaction.atomic
    def perform_create(self, serializer):
        """
        Tworzy nowe zgłoszenie ORAZ pierwszą wiadomość.
        Nadpisane, aby poprawnie obsłużyć pole 'body'.
        """
        validated_data = serializer.validated_data

        body = validated_data.pop('body')

        ticket = Ticket.objects.create(
            user=self.request.user,
            **validated_data
        )

        TicketMessage.objects.create(
            ticket=ticket,
            author=self.request.user,
            body=body
        )

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """
        Niestandardowa akcja dla klienta do wysłania odpowiedzi.
        POST /api/v1/support/tickets/<id>/reply/
        """
        ticket = self.get_object()
        serializer = TicketReplySerializer(data=request.data)

        if serializer.is_valid():
            TicketMessage.objects.create(
                ticket=ticket,
                author=request.user,
                body=serializer.validated_data['body']
            )

            ticket.status = Ticket.STATUS_NEW
            ticket.save(update_fields=['status', 'updated_at'])

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    permission_classes = [IsAuthenticated, IsAdminUser]

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
            return TicketAdminUpdateSerializer
        if self.action == 'reply':
            return TicketReplySerializer
        return TicketDetailSerializer

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """
        Niestandardowa akcja dla admina do wysłania odpowiedzi.
        POST /api/v1/admin/support/tickets/<id>/reply/
        """
        ticket = self.get_object()
        serializer = TicketReplySerializer(data=request.data)

        if serializer.is_valid():
            TicketMessage.objects.create(
                ticket=ticket,
                author=request.user,
                body=serializer.validated_data['body']
            )

            ticket.status = Ticket.STATUS_IN_PROGRESS
            ticket.save(update_fields=['status', 'updated_at'])

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
