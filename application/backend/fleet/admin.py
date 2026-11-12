from django.contrib import admin
from .models import Car

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste du tableau admin
    list_display = (
        'id', 
        'name', 
        'registration', 
        'category', 
        'price', 
        'status', 
        'fuel', 
        'transmission'
    )
    
    # Filtres disponibles sur le côté droit
    list_filter = ('status', 'category', 'fuel', 'transmission', 'airConditioning')
    
    # Champs de recherche (recherche par nom ou immatriculation)
    search_fields = ('name', 'registration')
    
    # Permet d'éditer le statut directement depuis la liste
    list_editable = ('status',)