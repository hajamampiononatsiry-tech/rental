from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from facture.models import Facture

class Command(BaseCommand):
    help = "Envoie un email d'avertissement aux clients dont la facture impayée va expirer sous peu."

    def handle(self, *args, **options):
        today = date.today()
        # Date cible : rappel envoyé 1 jour avant la date de début de réservation si non payé
        date_alerte = today + timedelta(days=1)

        # Filtrer les factures en attente dont la réservation commence demain et sans aucun règlement
        factures_a_prevenir = Facture.objects.select_related('reservation').filter(
            statut='En attente',
            montant_paye=0,
            reservation__start_date=date_alerte
        )

        count = 0
        for facture in factures_a_prevenir:
            reservation = facture.reservation
            if not reservation:
                continue

            client_email = getattr(reservation, 'client_email', None)
            if not client_email and hasattr(reservation, 'client') and reservation.client:
                client_email = getattr(reservation.client, 'email', None)

            if client_email:
                sujet = f"Rappel : Votre facture {facture.reference} expire bientôt - ADRWARE"
                message_texte = (
                    f"Bonjour,\n\n"
                    f"Nous vous rappelons que votre réservation pour le véhicule '{getattr(reservation, 'car_name', 'concerné')}' "
                    f"prévue le {reservation.start_date} est en attente de règlement.\n"
                    f"Sans paiement de votre part, cette facture et votre réservation seront automatiquement annulées.\n\n"
                    f"Merci de régulariser votre situation dès que possible sur votre espace client.\n\n"
                    f"Cordialement,\nL'équipe ADRWARE Car Rental"
                )

                try:
                    sender_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@adrware.mg')
                    email = EmailMultiAlternatives(
                        subject=sujet,
                        body=message_texte,
                        from_email=sender_email,
                        to=[client_email]
                    )
                    email.send()
                    count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Erreur d'envoi pour {client_email}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"{count} email(s) de rappel d'expiration envoyé(s) avec succès."))