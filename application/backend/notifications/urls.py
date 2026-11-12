from django.urls import path
from .views import get_admin_notifications, mark_notification_read, mark_all_notifications_read

urlpatterns = [
    path('', get_admin_notifications, name='get_admin_notifications'),
    path('mark-all-read/', mark_all_notifications_read, name='mark_all_notifications_read'),  
    path('<str:notification_key>/mark-read/', mark_notification_read, name='mark_notification_read'),
]