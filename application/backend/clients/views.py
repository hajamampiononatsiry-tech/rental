from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        queryset = (
            Client.objects.select_related('user')
            .filter(Q(user__isnull=True) | Q(user__is_staff=False, user__is_superuser=False))
            .order_by('-id')
        )

        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(last_name__icontains=search)
                | Q(first_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
                | Q(address__icontains=search)
            )
        return queryset

    @transaction.atomic
    def perform_destroy(self, instance):
        """Supprime le client ainsi que son compte utilisateur Django associé."""
        user = instance.user
        instance.delete()
        if user:
            user.delete()

    @action(detail=True, methods=['post', 'patch'])
    def ban(self, request, pk=None):
        """Action pour bannir un client"""
        client = self.get_object()
        reason = request.data.get('ban_reason') or request.data.get('banReason') or ''

        client.is_banned = True
        client.ban_reason = reason
        client.save(update_fields=['is_banned', 'ban_reason'])

        serializer = self.get_serializer(client)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'])
    def unban(self, request, pk=None):
        """Action pour débannir un client"""
        client = self.get_object()

        client.is_banned = False
        client.ban_reason = ''
        client.save(update_fields=['is_banned', 'ban_reason'])

        serializer = self.get_serializer(client)
        return Response(serializer.data, status=status.HTTP_200_OK)