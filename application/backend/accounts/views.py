import random
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django_rest_passwordreset.models import ResetPasswordToken
from rest_framework import generics, permissions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.utils import send_brevo_email
from clients.models import Client
from .serializers import RegisterSerializer, UserProfileSerializer

User = get_user_model()


def instance_is_admin(user):
    """Vérifie si l'utilisateur est un membre du staff ou un superadministrateur."""
    return bool(user.is_staff or user.is_superuser)


def sync_client_profile(user):
    """Crée ou met à jour la fiche Client avec les données complètes du CustomUser en évitant les doublons."""
    if instance_is_admin(user):
        return None

    phone_val = getattr(user, 'phone_number', None) or getattr(user, 'phone', '') or ''
    address_val = getattr(user, 'address', None) or ''
    email_val = (user.email or '').strip().lower()

    client = Client.objects.filter(user=user).first()
    if not client and email_val:
        client = Client.objects.filter(email__iexact=email_val).first()

    if client:
        client.user = user
        client.first_name = user.first_name or user.username or ''
        client.last_name = user.last_name or ''
        client.email = email_val
        if phone_val:
            client.phone = phone_val
        if address_val:
            client.address = address_val
        client.save(update_fields=['user', 'first_name', 'last_name', 'email', 'phone', 'address'])
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
        is_web_login = bool(request.data.get('is_web', False))
        identifier = request.data.get('username') or request.data.get('email')

        if identifier:
            identifier = str(identifier).strip().lower()
            user = (
                User.objects.filter(email__iexact=identifier).first()
                or User.objects.filter(username__iexact=identifier).first()
                or User.objects.filter(phone_number=identifier).first()
            )
            if user:
                if not user.is_active:
                    raise AuthenticationFailed(
                        "Votre compte est inactif. Veuillez valider votre code OTP ou attendre l'activation par l'administrateur."
                    )
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
        if mutable_data.get('email'):
            mutable_data['email'] = str(mutable_data['email']).strip().lower()

        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        user.is_active = False
        user.save(update_fields=['is_active'])

        if instance_is_admin(user):
            try:
                base_url = getattr(settings, 'BACKEND_URL', 'https://adrware-backend.onrender.com').rstrip('/')
                activation_url = f"{base_url}/api/accounts/activate/{user.id}/"
                subject = "🔔 Nouveau compte Staff/Admin en attente d'activation - ADRWARE"
                html_content = f"""
                    <p>Bonjour Super-Admin,</p>
                    <p>Un nouveau compte administrateur/staff vient de s'inscrire :</p>
                    <ul>
                        <li><b>Nom :</b> {user.first_name} {user.last_name}</li>
                        <li><b>Email :</b> {user.email}</li>
                        <li><b>Téléphone :</b> {getattr(user, 'phone_number', 'N/A')}</li>
                    </ul>
                    <p>Pour activer son compte immédiatement, veuillez cliquer sur le lien ci-dessous :</p>
                    <p><a href="{activation_url}" style="padding: 10px 15px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Activer le compte</a></p>
                """
                send_brevo_email(
                    to_email="adrwarecontact@gmail.com",
                    to_name="Super-Admin",
                    subject=subject,
                    html_content=html_content
                )
            except Exception as e:
                print(f"Erreur d'envoi d'e-mail d'activation Staff via Brevo : {e}")

            return Response({
                "message": "Inscription réussie. Votre compte administrateur est en attente d'activation par le super-administrateur (adrwarecontact@gmail.com).",
                "email": user.email,
                "is_staff": user.is_staff
            }, status=status.HTTP_201_CREATED)

        sync_client_profile(user)

        try:
            ResetPasswordToken.objects.filter(user=user).delete()
            otp_code = f"{random.randint(0, 999999):06d}"
            ResetPasswordToken.objects.create(user=user, key=otp_code)

            subject = "🔐 Votre code OTP à 6 chiffres - ADRWARE"
            html_content = f"""
                <p>Bonjour {user.first_name or 'Client'},</p>
                <p>Votre code de vérification OTP à 6 chiffres pour activer votre compte est :</p>
                <h2 style="color: #4f46e5; letter-spacing: 2px;">{otp_code}</h2>
                <p>Veuillez saisir ce code dans l'application pour valider votre inscription.</p>
            """
            send_brevo_email(
                to_email=user.email,
                to_name=user.get_full_name() or "Client",
                subject=subject,
                html_content=html_content
            )
        except Exception as e:
            print(f"Erreur d'envoi d'e-mail OTP via Brevo : {e}")

        return Response({
            "message": "Inscription réussie. Veuillez entrer le code OTP à 6 chiffres reçu par e-mail pour activer votre compte.",
            "email": user.email,
            "is_staff": user.is_staff
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    """Permet au client mobile de valider son compte en saisissant le code OTP à 6 chiffres reçu par e-mail."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email') or '').strip().lower()
        otp_code = request.data.get('otp') or request.data.get('otp_code')
        otp_code = str(otp_code).strip() if otp_code else ''

        if not email or not otp_code:
            return Response({"error": "L'e-mail et le code OTP sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        token_record = ResetPasswordToken.objects.filter(user=user, key=otp_code).order_by('-created_at').first()
        if token_record:
            user.is_active = True
            user.save(update_fields=['is_active'])
            ResetPasswordToken.objects.filter(user=user).delete()
            return Response({"message": "Compte activé avec succès ! Vous pouvez maintenant vous connecter."}, status=status.HTTP_200_OK)

        return Response({"error": "Code OTP invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)


class ActivateAccountView(APIView):
    """Permet au super-administrateur d'activer un compte Staff directement via le lien reçu par e-mail."""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        target_user = User.objects.filter(id=user_id).first()
        if not target_user:
            return HttpResponse(
                "<h2 style='font-family: Arial; text-align: center; color: red; margin-top: 50px;'>"
                "❌ Erreur : Utilisateur cible introuvable."
                "</h2>",
                status=404
            )

        target_user.is_active = True
        target_user.save(update_fields=['is_active'])
        return HttpResponse(
            f"<h2 style='font-family: Arial; text-align: center; color: green; margin-top: 50px;'>"
            f"✅ Le compte de <b>{target_user.email}</b> a été activé avec succès par le super-administrateur !"
            f"</h2>",
            status=200
        )


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

    def _get_target_user(self, email_param=None):
        if email_param:
            user = User.objects.filter(email__iexact=str(email_param).strip().lower()).order_by('-solde_depot').first()
            if user:
                return user
        return User.objects.filter(solde_depot__gt=0).order_by('-solde_depot').first() or User.objects.first()

    def _build_user_payload(self, user):
        data = dict(UserProfileSerializer(user).data)
        data['solde_depot'] = float(getattr(user, 'solde_depot', 0.0) or 0.0)
        try:
            client_profile = Client.objects.filter(user=user).first()
            data['total_rentals'] = client_profile.reservations.filter(status='Validée').count() if client_profile else 0
        except Exception:
            data['total_rentals'] = 0
        return data

    def get(self, request):
        email_param = request.query_params.get('email') or request.data.get('email')
        user = self._get_target_user(email_param)
        if not user:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._build_user_payload(user), status=status.HTTP_200_OK)

    def patch(self, request):
        email_param = request.data.get('client_email') or request.data.get('email')
        user = None
        if email_param:
            user = User.objects.filter(email__iexact=str(email_param).strip().lower()).order_by('-solde_depot').first()
        elif request.user and request.user.is_authenticated:
            user = request.user
        else:
            user = User.objects.filter(solde_depot__gt=0).order_by('-solde_depot').first()

        if not user:
            return Response({"error": "Utilisateur non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        sync_client_profile(updated_user)
        return Response(self._build_user_payload(updated_user), status=status.HTTP_200_OK)


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
        user.save(update_fields=['password'])
        return Response({"message": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)