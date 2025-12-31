import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = 'rafal123@gmail.com'

try:
    user = User.objects.get(email=email)
    if user.is_superuser:
        user.is_superuser = False
        user.is_staff = False # Removing staff status as well to ensure they are a regular user, as is typical when revoking admin rights.
        user.save()
        print(f"Successfully removed superuser and staff status for {email}")
    else:
        print(f"User {email} is not a superuser")
except User.DoesNotExist:
    print(f"User with email {email} does not exist")
except Exception as e:
    print(f"An error occurred: {e}")
