# EStore/celery.py
import os
from celery import Celery

# Ustaw domyślną zmienną środowiskową DJANGO_SETTINGS_MODULE
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')

# Stwórz instancję aplikacji Celery
app = Celery('EStore')

# Wczytaj konfigurację z EStore/settings.py
# (szuka tam zmiennych zaczynających się od "CELERY_")
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatycznie wykryj pliki tasks.py we wszystkich aplikacjach
app.autodiscover_tasks()