# clients/serializers.py
from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    
    totalRentals = serializers.IntegerField(source='total_rentals', read_only=True)
    totalSpent = serializers.DecimalField(source='total_spent', max_digits=12, decimal_places=2, read_only=True)
    isBanned = serializers.BooleanField(source='is_banned', required=False, default=False)
    banReason = serializers.CharField(source='ban_reason', allow_blank=True, required=False, allow_null=True)
    
    loyaltyStatus = serializers.ReadOnlyField(source='loyalty_status')
    discountPercent = serializers.ReadOnlyField(source='discount_percent')
    name = serializers.ReadOnlyField(source='full_name')

    class Meta:
        model = Client
        fields = [
            'id',
            'last_name',
            'first_name',
            'name',
            'email',
            'phone',
            'address',
            'image',
            'profile_picture',
            'total_rentals',
            'total_spent',
            'is_banned',
            'ban_reason',
            'totalRentals',
            'totalSpent',
            'isBanned',
            'banReason',
            'loyaltyStatus',
            'discountPercent',
        ]
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True, 'allow_null': True},
            'image': {'required': False, 'allow_null': True},
        }

    def get_image(self, obj):
        # 1. On cherche d'abord si une image existe directement sur la fiche Client
        img = getattr(obj, 'image', None)
        
        # 2. Si non trouvée, on vérifie si l'utilisateur rattaché a une photo (profile_picture ou image)
        if not img and hasattr(obj, 'user') and obj.user:
            img = getattr(obj.user, 'profile_picture', None) or getattr(obj.user, 'image', None)

        # 3. Si une image existe, on renvoie l'URL absolue
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.url)
            
            
        return None

    def get_profile_picture(self, obj):
        return self.get_image(obj)