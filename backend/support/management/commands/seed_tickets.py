"""
Management command to seed the database with sample support tickets.
Usage: python manage.py seed_tickets
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from support.models import Ticket, TicketMessage
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with sample support tickets'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed support tickets...')

        try:
            admin = User.objects.filter(is_staff=True).first()
            customer = User.objects.filter(is_staff=False).first()
            
            if not admin or not customer:
                self.stdout.write(self.style.ERROR('Need at least one admin and one customer user'))
                return
            
            self.stdout.write(f'Using admin: {admin.email}')
            self.stdout.write(f'Using customer: {customer.email}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error getting users: {e}'))
            return

        existing_count = Ticket.objects.count()
        if existing_count > 0:
            self.stdout.write(f'Found {existing_count} existing tickets. Deleting...')
            Ticket.objects.all().delete()

        tickets_data = [
            {
                'subject': 'Problem z płatnością',
                'status': Ticket.STATUS_NEW,
                'messages': [
                    {
                        'author': customer,
                        'body': 'Witam, mam problem z dokonaniem płatności. Po kliknięciu "Zapłać" nic się nie '
                                'dzieje. Próbowałem już kilka razy.',
                        'created_at': timezone.now() - timedelta(hours=2)
                    }
                ]
            },
            {
                'subject': 'Pytanie o czas dostawy',
                'status': Ticket.STATUS_IN_PROGRESS,
                'messages': [
                    {
                        'author': customer,
                        'body': 'Dzień dobry, zamówiłem produkt 3 dni temu (zamówienie #1234). Kiedy mogę spodziewać '
                                'się przesyłki?',
                        'created_at': timezone.now() - timedelta(days=1, hours=5)
                    },
                    {
                        'author': admin,
                        'body': 'Dzień dobry! Sprawdziłem Pana zamówienie. Przesyłka została wysłana wczoraj i '
                                'powinna dotrzeć w ciągu 1-2 dni roboczych. Numer śledzenia przesyłki: 1234567890.',
                        'created_at': timezone.now() - timedelta(days=1, hours=2)
                    },
                    {
                        'author': customer,
                        'body': 'Dziękuję bardzo za szybką odpowiedź!',
                        'created_at': timezone.now() - timedelta(days=1, hours=1)
                    }
                ]
            },
            {
                'subject': 'Produkt niezgodny z opisem',
                'status': Ticket.STATUS_IN_PROGRESS,
                'messages': [
                    {
                        'author': customer,
                        'body': 'Otrzymany produkt różni się od tego na zdjęciu. Kolor jest zupełnie inny niż w '
                                'opisie. Chciałbym zwrócić produkt.',
                        'created_at': timezone.now() - timedelta(hours=8)
                    },
                    {
                        'author': admin,
                        'body': 'Bardzo przepraszamy za niedogodności. Oczywiście może Pan zwrócić produkt. Proszę '
                                'wypełnić formularz zwrotu dostępny w linku: [link]. Po otrzymaniu zwrotu natychmiast '
                                'zwrócimy pieniądze.',
                        'created_at': timezone.now() - timedelta(hours=6)
                    }
                ]
            },
            {
                'subject': 'Gratulacje za świetny sklep!',
                'status': Ticket.STATUS_CLOSED,
                'messages': [
                    {
                        'author': customer,
                        'body': 'Chciałem podzielić się pozytywną opinią. Zamówienie dotarło szybko, produkt świetnej '
                                'jakości. Bardzo polecam!',
                        'created_at': timezone.now() - timedelta(days=3)
                    },
                    {
                        'author': admin,
                        'body': 'Bardzo dziękujemy za tak miłe słowa! To dla nas ogromna motywacja do dalszej pracy. '
                                'Zapraszamy ponownie!',
                        'created_at': timezone.now() - timedelta(days=3, hours=-2)
                    }
                ]
            },
            {
                'subject': 'Zniżka dla stałego klienta',
                'status': Ticket.STATUS_CLOSED,
                'messages': [
                    {
                        'author': customer,
                        'body': 'Jestem Państwa klientem już od 2 lat. Czy są jakieś zniżki dla stałych klientów?',
                        'created_at': timezone.now() - timedelta(days=5)
                    },
                    {
                        'author': admin,
                        'body': 'Dziękujemy za lojalność! Tak, mamy program lojalnościowy. Za każde zamówienie zbiera '
                                'Pan punkty, które można wymienić na zniżki. Dodatkowo wysłałem Panu na email '
                                'specjalny kod rabatowy 15% na następne zakupy.',
                        'created_at': timezone.now() - timedelta(days=5, hours=-3)
                    },
                    {
                        'author': customer,
                        'body': 'Wow, to super! Dziękuję bardzo :)',
                        'created_at': timezone.now() - timedelta(days=5, hours=-4)
                    }
                ]
            }
        ]

        created_tickets = 0
        created_messages = 0

        for ticket_data in tickets_data:
            try:
                ticket = Ticket.objects.create(
                    user=customer,
                    subject=ticket_data['subject'],
                    status=ticket_data['status']
                )
                
                if ticket_data['messages']:
                    ticket.created_at = ticket_data['messages'][0]['created_at']
                    ticket.updated_at = ticket_data['messages'][-1]['created_at']
                    ticket.save()
                
                created_tickets += 1
                self.stdout.write(f'  Created ticket: {ticket.subject}')

                for msg_data in ticket_data['messages']:
                    message = TicketMessage.objects.create(
                        ticket=ticket,
                        author=msg_data['author'],
                        body=msg_data['body']
                    )
                    message.created_at = msg_data['created_at']
                    message.save()
                    created_messages += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error creating ticket: {e}'))
                continue

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully seeded {created_tickets} tickets with {created_messages} messages!'
        ))
