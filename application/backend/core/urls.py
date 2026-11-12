from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from fleet.views import CarViewSet
from facture.views import FactureViewSet, send_invoice_email, get_server_ip
from reservation.views import ReservationViewSet 
from maintenance.views import MaintenanceViewSet
from clients.views import ClientViewSet
from notifications.views import get_admin_notifications
from facture.views import verify_invoice_view


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
    
]

# Support de la lecture des fichiers médias (images des voitures) en mode dev
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)