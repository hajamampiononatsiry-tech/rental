from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework.routers import DefaultRouter

# Imports pour Swagger / OpenAPI
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from fleet.views import CarViewSet
from facture.views import FactureViewSet, send_invoice_email, get_server_ip
from reservation.views import ReservationViewSet 
from maintenance.views import MaintenanceViewSet
from clients.views import ClientViewSet
from notifications.views import get_admin_notifications
from facture.views import verify_invoice_view

# Configuration de la vue Swagger
schema_view = get_schema_view(
   openapi.Info(
      title="ADRWARE API Documentation",
      default_version='v1',
      description="Documentation interactive de l'API REST pour la plateforme de gestion de location de voitures ADRWARE.",
      contact=openapi.Contact(email="contact@adrware.mg"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

router = DefaultRouter()
router.register(r'cars', CarViewSet, basename='car')
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'maintenances', MaintenanceViewSet, basename='maintenance')  

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/notifications/', include('notifications.urls')),
    path('api/factures/send-email/', send_invoice_email, name='send-invoice-email'),
    path('api/server-ip/', get_server_ip, name='server-ip'),
    path('api/', include(router.urls)),
    path('api/', include('stats.urls')), 
    path('api/chatbot/', include('chatbot.urls')),
    path('api/notifications/', get_admin_notifications, name='admin-notifications'),
    path('api/accounts/', include('accounts.urls')),
    path('verify/', verify_invoice_view, name='verify_invoice'),

    # Routes Swagger et ReDoc
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Servir les fichiers médias en production sur Render et en local
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)