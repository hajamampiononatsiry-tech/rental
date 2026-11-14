from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from clients.models import Client
from accounts.utils import send_brevo_email  # 👈 Importe la fonction Brevo

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
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=email_val,
            email=email_val,
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            profile_picture=validated_data.get('profile_picture', None),
            is_staff=is_admin,
            is_verified=True,     
            is_active=False       
        )
        
        try:
            activation_url = f"https://adrware-backend.onrender.com/api/accounts/activate/{user.id}/"
            subject = "🔔 Nouveau compte en attente d'activation - ADRWARE"
            html_content = f"""
                <p>Bonjour Super-Admin,</p>
                <p>Un nouvel utilisateur s'est inscrit :</p>
                <ul>
                    <li><b>Nom :</b> {user.first_name} {user.last_name}</li>
                    <li><b>Email :</b> {user.email}</li>
                    <li><b>Téléphone :</b> {getattr(user, 'phone_number', 'N/A')}</li>
                </ul>
                <p>Pour activer ce compte, veuillez cliquer sur le lien ci-dessous :</p>
                <p><a href="{activation_url}" style="padding: 10px 15px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Activer le compte</a></p>
            """
            send_brevo_email(
                to_email="adrwarecontact@gmail.com",
                to_name="Super-Admin",
                subject=subject,
                html_content=html_content
            )
        except Exception as e:
            print(f"Erreur d'envoi d'e-mail d'activation via Brevo : {e}")

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    total_rentals = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'is_staff', 'is_verified', 'solde_depot', 'total_rentals')
        read_only_fields = ('id', 'username', 'is_staff', 'is_verified', 'total_rentals')

    def get_total_rentals(self, obj):
        try:
            client_profile = Client.objects.filter(user=obj).first()
            if client_profile:
                return client_profile.reservations.filter(status='Validée').count()
        except Exception:
            pass
        return 0