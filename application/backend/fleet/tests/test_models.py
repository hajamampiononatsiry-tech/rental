import pytest
from fleet.models import Car

@pytest.mark.django_db
def test_vehicle_creation():
    """
    Test unitaire pour valider la création d'un véhicule dans la base PostgreSQL.
    """
    # 1. Création d'un véhicule de test
    vehicle = Car.objects.create(
        name="WRANGLER",
        registration="1234 TBB"
    )
    
    # 2. Vérifications sur l'instance (vehicle) et non sur la classe (Car)
    assert vehicle.name == "WRANGLER"
    assert vehicle.registration == "1234 TBB"
    assert Car.objects.count() >= 1