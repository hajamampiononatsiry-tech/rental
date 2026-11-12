from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from clients.models import Client

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    is_admin = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'password', 'phone_number', 'address', 'profile_picture', 'is_admin')

    def validate_email(self, value):
        email_val = value.lower().strip()
        if User.objects.filter(username=email_val).exists() or User.objects.filter(email__iexact=email_val).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cette adresse e-mail.")
        return email_val

    def validate(self, attrs):
        email_val = attrs.get('email', '').lower().strip()
        attrs['username'] = email_val
        attrs['email'] = email_val
        return super().validate(attrs)

    def create(self, validated_data):
        is_admin = validated_data.pop('is_admin', False)
        email_val = validated_data['email']

        user = User.objects.create_user(
            username=email_val,
            email=email_val,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            profile_picture=validated_data.get('profile_picture', None),
            is_staff=is_admin,
            is_verified=True,     # Validé puisqu'on supprime l'OTP
            is_active=False       # Inactif par défaut jusqu'à activation par le super-admin
        )
        
        # Envoi direct du lien d'activation au super-admin adrwarecontact@gmail.com sans passer par l'OTP
        try:
            activation_url = f"http://localhost:8000/api/accounts/activate/{user.id}/"
            subject = "🔔 Nouveau compte en attente d'activation - ADRWARE"
            message = (
                f"Bonjour Super-Admin,\n\n"
                f"Un nouvel utilisateur s'est inscrit :\n"
                f"- Nom : {user.first_name} {user.last_name}\n"
                f"- Email : {user.email}\n"
                f"- Téléphone : {getattr(user, 'phone_number', 'N/A')}\n\n"
                f"Pour activer ce compte, veuillez cliquer sur le lien ci-dessous :\n"
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

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    total_rentals = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'is_staff', 'is_verified', 'solde_depot', 'total_rentals')
        read_only_fields = ('id', 'username', 'is_staff', 'is_verified', 'total_rentals')

    def get_total_rentals(self, obj):
        try:
            # Récupère le profil client associé et compte ses réservations validées[cite: 13]
            client_profile = Client.objects.filter(user=obj).first()
            if client_profile:
                return client_profile.reservations.filter(status='Validée').count()
        except Exception:
            pass
        return 0