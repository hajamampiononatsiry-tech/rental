from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FactureViewSet, send_invoice_email, get_server_ip

router = DefaultRouter()
router.register(r'factures', FactureViewSet, basename='facture')

urlpatterns = [
    path('factures/send-email/', send_invoice_email, name='send-invoice-email'),
    path('server-ip/', get_server_ip, name='server-ip'),
    path('', include(router.urls)),
   
]