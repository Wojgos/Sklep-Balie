from celery import shared_task
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

User = get_user_model()


@shared_task
def send_registration_confirmation_email_task(user_id):
    """
    Asynchroniczne zadanie wysyłania e-maila weryfikacyjnego.
    """
    try:
        user = User.objects.get(id=user_id)

        email_address = EmailAddress.objects.get(
            user=user,
            primary=True
        )

        email_address.send_confirmation(request=None, signup=True)

        return f"Wysłano e-mail weryfikacyjny do {user.email}"

    except User.DoesNotExist:
        return f"Błąd zadania: Użytkownik o ID {user_id} nie został znaleziony."
    except EmailAddress.DoesNotExist:
        return f"Błąd zadania: Nie znaleziono obiektu EmailAddress dla użytkownika {user_id}."
    except Exception as e:
        return f"Błąd zadania dla {user_id}: {str(e)}"
