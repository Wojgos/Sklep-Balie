from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Order
from .pdf_generator import generate_invoice_pdf


@shared_task
def send_invoice_email_task(order_id):
    """
    Zadanie Celery do generowania i wysyłania faktury PDF.
    """
    try:
        order = Order.objects.get(id=order_id)

        pdf_data = generate_invoice_pdf(order)
        pdf_filename = f"zamowienie_{order.id}.pdf"

        subject = f"Potwierdzenie zamówienia nr {order.id} - Balie Ogrodowe"
        message = (
            f"Witaj {order.first_name},\n\n"
            f"Dziękujemy za złożenie zamówienia w naszym sklepie.\n"
            f"W załączniku przesyłamy potwierdzenie w formacie PDF.\n\n"
            f"Pozdrawiamy,\n"
            f"Zespół Balie Ogrodowe Premium"
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [order.email]

        mail = send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )

        print(f"--- SYMULACJA WYSYŁKI E-MAIL ---")
        print(f"DO: {order.email}")
        print(f"TEMAT: {subject}")
        print(f"TREŚĆ: {message}")
        print(f"[Załącznik PDF '{pdf_filename}' (rozmiar: {len(pdf_data)} bajtów) został wygenerowany]")
        print(f"----------------------------------")

        return f"Wysłano e-mail dla zamówienia {order_id}"

    except Order.DoesNotExist:
        return f"Błąd: Zamówienie {order_id} nie zostało znalezione."
    except Exception as e:
        return f"Błąd podczas wysyłania e-maila dla {order_id}: {str(e)}"
