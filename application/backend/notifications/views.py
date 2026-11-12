import imaplib
import email
from email.header import decode_header
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from reservation.models import Reservation
from facture.models import Facture
from clients.models import Client
from .models import Notification

@api_view(['GET'])
@permission_classes([AllowAny])
def get_admin_notifications(request):
    # 1. Synchronisation automatique des derniers événements en base de données
    
    # Factures / Paiements
    try:
        recent_factures = Facture.objects.select_related('reservation').exclude(statut='En attente').order_by('-id')[:5]
        for fac in recent_factures:
            key = f"pay-{fac.id}"
            if not Notification.objects.filter(notification_key=key).exists():
                client_name = getattr(fac.reservation, 'client_name', 'Client')
                Notification.objects.create(
                    notification_key=key,
                    type='paiement',
                    title='Paiement reçu !',
                    message=f"{client_name} a réglé {float(fac.montant_paye):,.2f} Ar via {fac.mode_paiement}."
                )
    except Exception as e:
        print("Erreur sync paiements:", e)

    # Réservations
    try:
        recent_reservations = Reservation.objects.select_related('car', 'client').order_by('-created_at')[:5]
        for res in recent_reservations:
            key = f"res-{res.id}"
            if not Notification.objects.filter(notification_key=key).exists():
                car_name = getattr(res, 'car', None) and res.car.name or 'Véhicule'
                Notification.objects.create(
                    notification_key=key,
                    type='reservation',
                    title='Nouvelle réservation',
                    message=f"{res.client_name or 'Client'} a réservé {car_name}."
                )
    except Exception as e:
        print("Erreur sync réservations:", e)

    # Nouveaux clients
    try:
        recent_clients = Client.objects.order_by('-id')[:5]
        for client in recent_clients:
            key = f"client-{client.id}"
            if not Notification.objects.filter(notification_key=key).exists():
                client_name = getattr(client, 'name', '') or f"{getattr(client, 'first_name', '')} {getattr(client, 'last_name', '')}".strip() or client.email
                Notification.objects.create(
                    notification_key=key,
                    type='client',
                    title='Nouveau client inscrit',
                    message=f"Inscription de {client_name}."
                )
    except Exception as e:
        print("Erreur sync clients:", e)

    # Emails Gmail (Pannes, Propositions, etc.)
    try:
        mail_user = getattr(settings, 'EMAIL_ACCOUNT_USER', 'adrwarecontact@gmail.com')
        mail_pass = getattr(settings, 'EMAIL_ACCOUNT_PASSWORD', None)

        if mail_pass:
            mail = imaplib.IMAP4_SSL('imap.gmail.com')
            mail.login(mail_user, mail_pass)
            mail.select('inbox')

            status, messages = mail.search(None, 'ALL')
            mail_ids = messages[0].split()

            for mail_id in mail_ids[-5:]:
                _, msg_data = mail.fetch(mail_id, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        subject, encoding = decode_header(msg['Subject'])[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding or 'utf-8', errors='ignore')
                        
                        from_user = msg.get('From', 'Expéditeur inconnu')
                        key = f"email-{mail_id.decode('utf-8')}"

                        if not Notification.objects.filter(notification_key=key).exists():
                            # Détection automatique du type (panne ou proposition)
                            sub_lower = (subject or '').lower()
                            notif_type = 'proposition'
                            if 'panne' in sub_lower or 'technique' in sub_lower or 'urgence' in sub_lower:
                                notif_type = 'panne'

                            Notification.objects.create(
                                notification_key=key,
                                type=notif_type,
                                title=subject or 'Panne / Remarque',
                                message=f"De : {from_user}"
                            )
            mail.logout()
    except Exception as e:
        print("Erreur lors de la lecture IMAP Gmail :", e)

    # 2. Renvoyer toutes les notifications stockées avec leur statut global `is_read`
    notifications_qs = Notification.objects.order_by('-created_at')[:20]
    data = []
    for n in notifications_qs:
        data.append({
            'id': n.notification_key,
            'type': n.type,
            'title': n.title,
            'message': n.message,
            'time': n.created_at.strftime('%d/%m/%Y %H:%M'),
            'is_read': n.is_read
        })

    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_notification_read(request, notification_key):
    """Marque la notification comme lue pour TOUS les travailleurs"""
    try:
        notif = Notification.objects.get(notification_key=notification_key)
        notif.is_read = True
        if request.user.is_authenticated:
            notif.read_by = request.user.email
        notif.save()
        return Response({'status': 'success'}, status=200)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification non trouvée'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_all_notifications_read(request):
    """Marque TOUTES les notifications comme lues pour TOUT LE MONDE"""
    Notification.objects.filter(is_read=False).update(is_read=True)
    return Response({'status': 'success'}, status=200)