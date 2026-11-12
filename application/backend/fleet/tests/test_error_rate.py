import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_server_error_rate():

    client = APIClient()
    total_requests = 50  # Nombre total de requêtes de test
    server_errors = 0

    endpoint = "/api/reservations/" 

    for _ in range(total_requests):
        response = client.get(endpoint)
        
    
        if response.status_code >= 500:
            server_errors += 1

    # Calcul du taux d'erreur en pourcentage
    te_rate = (server_errors / total_requests) * 100

    print(f"\n--- RAPPORT DE TEST DE PERFORMANCE (TE) ---")
    print(f"Total requêtes : {total_requests}")
    print(f"Erreurs serveur 5xx : {server_errors}")
    print(f"Taux d'erreur mesuré (TE) : {te_rate}%")

    
    assert te_rate <= 0.1, f"Le taux d'erreur ({te_rate}%) dépasse la limite autorisée de 0.1% !"