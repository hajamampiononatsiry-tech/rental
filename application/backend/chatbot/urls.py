from django.urls import path
from .views import CompanyAIAssistantView

urlpatterns = [
    path('ask/', CompanyAIAssistantView.as_view(), name='chatbot_ask'),
]