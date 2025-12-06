from django.db import models
from django.conf import settings
from django.utils import timezone


class Ticket(models.Model):
    """
    Główny model zgłoszenia (wątku).
    """

    STATUS_NEW = 'new'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_CLOSED = 'closed'

    STATUS_CHOICES = [
        (STATUS_NEW, 'Nowe'),
        (STATUS_IN_PROGRESS, 'W trakcie rozpatrywania'),
        (STATUS_CLOSED, 'Zamknięte'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets',
        verbose_name="Użytkownik"
    )

    subject = models.CharField(max_length=255, verbose_name="Temat")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_NEW,
        verbose_name="Status"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data utworzenia"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Data aktualizacji"
    )

    class Meta:
        verbose_name = "Zgłoszenie"
        verbose_name_plural = "Zgłoszenia"
        ordering = ['-updated_at']

    def __str__(self):
        return f"Zgłoszenie #{self.id} - {self.subject}"


class TicketMessage(models.Model):
    """
    Pojedyncza wiadomość w ramach zgłoszenia.
    """
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name="Zgłoszenie"
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="Autor"
    )

    body = models.TextField(verbose_name="Treść wiadomości")

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data wysłania"
    )

    class Meta:
        verbose_name = "Wiadomość w zgłoszeniu"
        verbose_name_plural = "Wiadomości w zgłoszeniach"
        ordering = ['created_at']

    def __str__(self):
        return f"Wiadomość od {self.author.username} (Zgłoszenie #{self.ticket.id})"
