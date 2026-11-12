from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'email', 'phone', 'total_rentals', 'total_spent', 'is_banned', 'loyalty_status')
    list_filter = ('is_banned', 'created_at')
    search_fields = ('name', 'email', 'phone')
    readonly_fields = ('total_rentals', 'total_spent', 'loyalty_status', 'discount_percent', 'created_at', 'updated_at')