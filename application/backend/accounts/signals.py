from django.core.mail import send_mail
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from django.conf import settings
from django_rest_passwordreset.signals import reset_password_token_created
import traceback

from clients.models import Client

User = get_user_model()

@receiver(post_save, sender=User)
def create_client_profile(sender, instance, created, **kwargs):
    if created:
        if not instance.is_staff and not instance.is_superuser:
            email_val = instance.email.lower() if instance.email else ''
            client = Client.objects.filter(user=instance).first()
            if not client and email_val:
                client = Client.objects.filter(email=email_val).first()

            if client:
                client.user = instance
                client.first_name = instance.first_name or instance.username or ''
                client.last_name = instance.last_name or ''
                client.email = email_val
                client.save()
            else:
                Client.objects.create(
                    user=instance,
                    first_name=instance.first_name or instance.username or '',
                    last_name=instance.last_name or '',
                    email=email_val,
                    phone='',
                    address=''
                )

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    try:
        token = reset_password_token.key
        user_email = reset_password_token.user.email

        request = getattr(instance, 'request', None)
        is_mobile = False

        if request:
            data = getattr(request, 'data', {})
            is_web = data.get('is_web', True)
            user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
            
            if not is_web or 'okhttp' in user_agent or 'react-native' in user_agent:
                is_mobile = True

        if is_mobile:
            message = (
                f"Bonjour,\n\n"
                f"Voici votre code de réinitialisation pour l'application mobile Adrware :\n\n"
                f"{token}\n\n"
                f"Veuillez copier et coller ce code dans l'application pour définir votre nouveau mot de passe."
            )
        else:
            reset_url = f"https://adrware.onrender.com/reset-password?token={token}"
            message = (
                f"Bonjour,\n\n"
                f"Utilisez le lien suivant pour réinitialiser votre mot de passe sur la plateforme web :\n"
                f"{reset_url}"
            )

        send_mail(
            subject="Réinitialisation de votre mot de passe - Adrware",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception as e:
        print("ERREUR CRITIQUE LORS DE L'ENVOI DU MAIL DE RESET :")
        traceback.print_exc()
        raise e