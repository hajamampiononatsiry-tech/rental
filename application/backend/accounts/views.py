# accounts/views.py
import random
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django_rest_passwordreset.models import ResetPasswordToken
from .serializers import RegisterSerializer, UserProfileSerializer
from clients.models import Client

User = get_user_model()


def instance_is_admin(user):
    """Vérifie si l'utilisateur est un membre du staff ou un superadministrateur."""
    return user.is_staff or user.is_superuser


def sync_client_profile(user):
    """Crée ou met à jour la fiche Client avec les données complètes du CustomUser en évitant les doublons."""
    if instance_is_admin(user):
        return None

    phone_val = getattr(user, 'phone_number', None) or getattr(user, 'phone', '') or ''
    address_val = getattr(user, 'address', None) or ''
    email_val = user.email.lower() if user.email else ''

    client = Client.objects.filter(user=user).first()
    if not client and email_val:
        client = Client.objects.filter(email=email_val).first()

    if client:
        client.user = user
        client.first_name = user.first_name or user.username or ''
        client.last_name = user.last_name or ''
        client.email = email_val
        if phone_val:
            client.phone = phone_val
        if address_val:
            client.address = address_val
        client.save()
    else:
        client = Client.objects.create(
            user=user,
            first_name=user.first_name or user.username or '',
            last_name=user.last_name or '',
            email=email_val,
            phone=phone_val,
            address=address_val,
        )
    return client


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vue de connexion JWT personnalisée pour cloisonner les accès :
    - Bloque les clients (is_staff = False) sur l'interface Web.
    - Bloque les administrateurs/staff (is_staff = True) sur l'application Mobile.
    - Vérifie que le compte est actif (is_active = True).
    """
    def post(self, request, *args, **kwargs):
        is_web_login = request.data.get('is_web', False)
        username = request.data.get('username') or request.data.get('email')
        
        if username:
            username = username.strip().lower()

        user = (
            User.objects.filter(email__iexact=username).first() or 
            User.objects.filter(username__iexact=username).first() or
            User.objects.filter(phone_number=username).first()
        )

        if user:
            if not user.is_active:
                raise AuthenticationFailed("Votre compte est inactif. Veuillez valider votre code OTP ou attendre l'activation par l'administrateur.")

            if is_web_login and not user.is_staff:
                raise AuthenticationFailed("Accès refusé : Cet espace est réservé exclusivement au personnel (Staff).")
            
            if not is_web_login and user.is_staff:
                raise AuthenticationFailed("Accès refusé : Les comptes administrateurs doivent utiliser l'interface Web.")

        return super().post(request, *args, **kwargs)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        mutable_data = request.data.copy()
        if 'email' in mutable_data and mutable_data['email']:
            mutable_data['email'] = mutable_data['email'].strip().lower()

        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Par défaut, le nouveau compte est inactif jusqu'à sa validation (OTP ou Admin)
        user.is_active = False
        user.save()

        # CAS 1 : Compte Staff / Admin -> Activation manuelle par adrwarecontact@gmail.com
        if user.is_staff or user.is_superuser:
            try:
                activation_url = f"http://localhost:8000/api/accounts/activate/{user.id}/"
                subject = "🔔 Nouveau compte Staff/Admin en attente d'activation - ADRWARE"
                message = (
                    f"Bonjour Super-Admin,\n\n"
                    f"Un nouveau compte administrateur/staff vient de s'inscrire :\n"
                    f"- Nom : {user.first_name} {user.last_name}\n"
                    f"- Email : {user.email}\n"
                    f"- Téléphone : {getattr(user, 'phone_number', 'N/A')}\n\n"
                    f"Pour activer son compte immédiatement, veuillez cliquer sur le lien ci-dessous :\n"
                    f"{activation_url}\n"
                )
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'adrwarecontact@gmail.com'),
                    recipient_list=['adrwarecontact@gmail.com'],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Erreur d'envoi d'e-mail d'activation : {e}")

            return Response({
                "message": "Inscription réussie. Votre compte administrateur est en attente d'activation par le super-administrateur (adrwarecontact@gmail.com).",
                "email": user.email,
                "is_staff": user.is_staff
            }, status=status.HTTP_201_CREATED)

        else:
            # CAS 2 : Client Mobile -> Envoi d'un code OTP à 6 chiffres par e-mail
            sync_client_profile(user)

            try:
                # Nettoyage des anciens tokens pour éviter les conflits
                ResetPasswordToken.objects.filter(user=user).delete()

                # Génération d'un code numérique exact à 6 chiffres
                otp_code = f"{random.randint(0, 999999):06d}"
                
                ResetPasswordToken.objects.create(user=user, key=otp_code)

                subject = "🔐 Votre code OTP à 6 chiffres - ADRWARE"
                message = (
                    f"Bonjour {user.first_name or 'Client'},\n\n"
                    f"Votre code de vérification OTP à 6 chiffres pour activer votre compte est :\n\n"
                    f"{otp_code}\n\n"
                    f"Veuillez saisir ce code dans l'application pour valider votre inscription."
                )
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'adrwarecontact@gmail.com'),
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Erreur d'envoi d'e-mail OTP : {e}")

            return Response({
                "message": "Inscription réussie. Veuillez entrer le code OTP à 6 chiffres reçu par e-mail pour activer votre compte.",
                "email": user.email,
                "is_staff": user.is_staff
            }, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    """
    Permet au client mobile de valider son compte en saisissant le code OTP à 6 chiffres reçu par e-mail.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        # On accepte soit 'otp' (envoyé par le mobile), soit 'otp_code'
        otp_code = request.data.get('otp') or request.data.get('otp_code')
        
        if otp_code:
            otp_code = str(otp_code).strip()

        if not email or not otp_code:
            return Response({"error": "L'e-mail et le code OTP sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            
            # Récupère le token le plus récent correspondant à l'utilisateur et au code saisi
            token_record = ResetPasswordToken.objects.filter(user=user, key=otp_code).order_by('-created_at').first()

            if token_record:
                user.is_active = True
                user.save()
                
                # Supprime tous les tokens associés pour nettoyer
                ResetPasswordToken.objects.filter(user=user).delete()
                
                return Response({"message": "Compte activé avec succès ! Vous pouvez maintenant vous connecter."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Code OTP invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

class ActivateAccountView(APIView):
    """
    Permet au super-administrateur (adrwarecontact@gmail.com) d'activer un compte Staff directement via le lien reçu par e-mail.
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            target_user.is_active = True
            target_user.save()
            return Response({"message": f"Le compte de {target_user.email} a été activé avec succès par le super-administrateur !"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur cible introuvable."}, status=status.HTTP_404_NOT_FOUND)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        sync_client_profile(user)


class UserMeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email_param = request.query_params.get('email') or request.data.get('email')
        user = None

        if email_param:
            user = User.objects.filter(email__iexact=email_param.strip().lower()).order_by('-solde_depot').first()
        
        if not user:
            user = User.objects.filter(solde_depot__gt=0).order_by('-solde_depot').first()
            if not user:
                user = User.objects.first()

        if not user:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserProfileSerializer(user)
        data = serializer.data
        data['solde_depot'] = float(getattr(user, 'solde_depot', 0.0))

        try:
            client_profile = Client.objects.filter(user=user).first()
            if client_profile:
                data['total_rentals'] = client_profile.reservations.filter(status='Validée').count()
            else:
                data['total_rentals'] = 0
        except Exception:
            data['total_rentals'] = 0

        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        email_param = request.data.get('client_email') or request.data.get('email')

        if email_param:
            user = User.objects.filter(email__iexact=email_param.strip().lower()).order_by('-solde_depot').first()

        if not user or not user.is_authenticated:
            user_with_balance = User.objects.filter(solde_depot__gt=0).order_by('-solde_depot').first()
            if user_with_balance:
                user = user_with_balance

        if not user:
            return Response({"error": "Utilisateur non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        
        sync_client_profile(updated_user)
        
        data = serializer.data
        data['solde_depot'] = float(getattr(updated_user, 'solde_depot', 0.0))
        
        try:
            client_profile = Client.objects.filter(user=updated_user).first()
            data['total_rentals'] = client_profile.reservations.filter(status='Validée').count() if client_profile else 0
        except Exception:
            data['total_rentals'] = 0

        return Response(data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"error": "L'ancien et le nouveau mot de passe sont requis."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "L'ancien mot de passe est incorrect."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response({"message": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)