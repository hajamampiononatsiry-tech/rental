from django.contrib import admin
from .models import Reservation

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'client_name', 
        'client_phone', 
        'car', 
        'start_date', 
        'end_date', 
        'total_price', 
        'status', 
        'origin'
    )
    list_filter = ('status', 'origin', 'created_at')
    search_fields = ('client_name', 'client_phone', 'car__name')
    list_editable = ('status',)