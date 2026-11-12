from django.apps import AppConfig

class MaintenancesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'maintenance'  

    def ready(self):
        import maintenance.signals  