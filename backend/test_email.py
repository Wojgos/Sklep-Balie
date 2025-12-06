import os
import django
from django.core.mail import send_mail
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

print("--- TEST WYSYŁANIA E-MAILA ---")
print(f"Backend: {settings.EMAIL_BACKEND}")
print(f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
print(f"Użytkownik: {settings.EMAIL_HOST_USER}")

try:
    send_mail(
        subject='Test SMTP Django',
        message='To jest wiadomość testowa z Twojego sklepu. Jeśli to czytasz, konfiguracja działa!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.EMAIL_HOST_USER],
        fail_silently=False,
    )
    print("\nSUKCES! Wiadomość wysłana. Sprawdź skrzynkę.")
except Exception as e:
    print("\nBŁĄD WYSYŁANIA:")
    print(e)
