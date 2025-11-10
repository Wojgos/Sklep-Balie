from django.contrib.auth.models import AbstractUser
from django.db import models


# Create your models here.
class CustomUser(AbstractUser):

    loyalty_points = models.PositiveIntegerField(
        default=0,
        verbose_name="Punkty lojalnościowe",
        help_text="Punkty zebrane w programie lojalnościowym."
    )

    def __str__(self):
        return self.username
