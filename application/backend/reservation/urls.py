from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReservationViewSet
from .views import get_admin_notifications

router = DefaultRouter()
router.register(r'reservations', ReservationViewSet)

urlpatterns = [
    path('notifications/', get_admin_notifications, name='admin-notifications'),
    path('', include(router.urls)),

]