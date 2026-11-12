from rest_framework import serializers
import json
from .models import Car

class CarSerializer(serializers.ModelSerializer):
    car_photo = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = '__all__'

    def get_car_photo(self, obj):
        request = self.context.get('request')
        
        # 1. Recherche d'un champ image direct
        car_image = (
            getattr(obj, 'image', None) or 
            getattr(obj, 'photo', None) or 
            getattr(obj, 'car_photo', None) or
            getattr(obj, 'picture', None)
        )

        # 2. Gestion de la colonne JSONB 'photos' (ex: data:image/jpeg;base64,...)
        if not car_image and hasattr(obj, 'photos'):
            photos_val = obj.photos
            if isinstance(photos_val, str):
                try:
                    photos_val = json.loads(photos_val)
                except Exception:
                    pass
            
            if isinstance(photos_val, list) and len(photos_val) > 0:
                first_p = photos_val[0]
                if isinstance(first_p, dict):
                    car_image = first_p.get('image') or first_p.get('file') or first_p.get('url') or first_p.get('photo')
                else:
                    car_image = first_p
            elif hasattr(photos_val, 'all'):
                try:
                    related_photos = photos_val.all()
                    if related_photos.exists():
                        first_photo = related_photos.first()
                        car_image = getattr(first_photo, 'image', None) or getattr(first_photo, 'file', None) or str(first_photo)
                except Exception:
                    pass

        if car_image:
            try:
                image_url = car_image.url if hasattr(car_image, 'url') else str(car_image)
            except Exception:
                image_url = str(car_image) if car_image else ''

            if image_url:
                # Si c'est du Base64 ou une URL absolue, on la renvoie telle quelle
                if image_url.startswith('data:image/') or image_url.startswith('http://') or image_url.startswith('https://'):
                    return image_url

                if request:
                    return request.build_absolute_uri(image_url)

                if image_url.startswith('/'):
                    return f"http://127.0.0.1:8000{image_url}"
                return f"http://127.0.0.1:8000/{image_url}"
                
        return ''