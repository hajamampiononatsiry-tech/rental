import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from fleet.models import Car

@pytest.mark.django_db
class TestCompanyAIAssistant:

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def setup_user_and_car(self):
        User = get_user_model()
        client_user = User.objects.create_user(
            username="hajamampionona",
            email="client@adrware.com", 
            password="password123", 
            first_name="Hajamampionona"
        )
        car = Car.objects.create(name="Toyota Rav4", status="Disponible", price=150000, seats=5, transmission="Automatique", fuel="Essence")
        return client_user, car

    def test_assistant_unauthorized_access(self, api_client):
        """Vérifie qu'un utilisateur non authentifié est bloqué (401 Unauthorized)"""
        url = reverse('chatbot_ask')
        response = api_client.post(url, {"message": "bonjour"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_assistant_greeting_malagasy(self, api_client, setup_user_and_car):
        """Vérifie la détection linguistique et la réponse en malagasy"""
        user, _ = setup_user_and_car
        api_client.force_authenticate(user=user)
        
        url = reverse('chatbot_ask')
        response = api_client.post(url, {"message": "Salama tsara androany"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert "Tonga soa eto amin'ny ADRWARE" in response.data['reply']

    def test_assistant_car_availability_check(self, api_client, setup_user_and_car):
      
        user, car = setup_user_and_car
        api_client.force_authenticate(user=user)

        url = reverse('chatbot_ask')
        response = api_client.post(url, {"message": "Est-ce que la Toyota Rav4 est libre du 10/12/2026 au 15/12/2026 ?"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert "libre" in response.data['reply'].lower() or "disponible" in response.data['reply'].lower()