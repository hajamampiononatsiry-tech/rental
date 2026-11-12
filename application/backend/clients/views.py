from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        # 1. Exclure les fiches clients rattachées à un compte Staff ou Superuser
        queryset = Client.objects.filter(
            Q(user__isnull=True) | Q(user__is_staff=False, user__is_superuser=False)
        ).order_by('-id')

        # 2. Gestion de la recherche dynamique
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(last_name__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(phone__icontains=search) |
                Q(address__icontains=search)
            )
        return queryset

    def perform_destroy(self, instance):
        """Supprime le client ainsi que son compte utilisateur Django associé."""
        user = instance.user  # Récupère l'utilisateur rattaché au client[cite: 19]
        instance.delete()     # Supprime la fiche Client[cite: 19]
        if user:
            user.delete()     # Supprime le compte utilisateur CustomUser[cite: 19]

    @action(detail=True, methods=['post', 'patch'])
    def ban(self, request, pk=None):
        """Action pour bannir un client[cite: 19]"""
        client = self.get_object()
        reason = request.data.get('ban_reason') or request.data.get('banReason') or ''
        
        client.is_banned = True
        client.ban_reason = reason
        client.save()

        serializer = self.get_serializer(client)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def unban(self, request, pk=None):
        """Action pour débannir un client[cite: 19]"""
        client = self.get_object()
        
        client.is_banned = False
        client.ban_reason = ''
        client.save()

        serializer = self.get_serializer(client)
        return Response(serializer.data, status=status.HTTP_200_OK)