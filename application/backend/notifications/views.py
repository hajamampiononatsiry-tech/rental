import imaplib
import email
from email.header import decode_header
from django.conf import settings
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from reservation.models import Reservation
from facture.models import Facture
from clients.models import Client
from .models import Notification


def _sync_notifications_if_needed():
    """Synchronise les notifications au maximum une fois toutes les 60 secondes."""
    if cache.get('admin_notifications_synced'):
        return

    cache.set('admin_notifications_synced', True, timeout=60)
    notifications_to_create = []

    # 1. Factures / Paiements (1 seule requête pour vérifier les clés existantes)
    try:
        recent_factures = list(
            Facture.objects.select_related('reservation')
            .exclude(statut='En attente')
            .order_by('-id')[:5]
        )
        pay_keys = [f"pay-{fac.id}" for fac in recent_factures]
        existing_pay = set(
            Notification.objects.filter(notification_key__in=pay_keys)
            .values_list('notification_key', flat=True)
        )
        for fac in recent_factures:
            key = f"pay-{fac.id}"
            if key not in existing_pay:
                client_name = getattr(fac.reservation, 'client_name', 'Client')
                notifications_to_create.append(
                    Notification(
                        notification_key=key,
                        type='paiement',
                        title='Paiement reçu !',
                        message=f"{client_name} a réglé {float(fac.montant_paye):,.2f} Ar via {fac.mode_paiement}."
                    )
                )
    except Exception as e:
        print("Erreur sync paiements:", e)

    # 2. Réservations
    try:
        recent_reservations = list(
            Reservation.objects.select_related('car')
            .order_by('-created_at')[:5]
        )
        res_keys = [f"res-{res.id}" for res in recent_reservations]
        existing_res = set(
            Notification.objects.filter(notification_key__in=res_keys)
            .values_list('notification_key', flat=True)
        )
        for res in recent_reservations:
            key = f"res-{res.id}"
            if key not in existing_res:
                car_name = res.car.name if getattr(res, 'car', None) else 'Véhicule'
                notifications_to_create.append(
                    Notification(
                        notification_key=key,
                        type='reservation',
                        title='Nouvelle réservation',
                        message=f"{res.client_name or 'Client'} a réservé {car_name}."
                    )
                )
    except Exception as e:
        print("Erreur sync réservations:", e)

    # 3. Nouveaux clients
    try:
        recent_clients = list(Client.objects.order_by('-id')[:5])
        client_keys = [f"client-{c.id}" for c in recent_clients]
        existing_clients = set(
            Notification.objects.filter(notification_key__in=client_keys)
            .values_list('notification_key', flat=True)
        )
        for client in recent_clients:
            key = f"client-{client.id}"
            if key not in existing_clients:
                client_name = (
                    getattr(client, 'name', '')
                    or f"{getattr(client, 'first_name', '')} {getattr(client, 'last_name', '')}".strip()
                    or client.email
                )
                notifications_to_create.append(
                    Notification(
                        notification_key=key,
                        type='client',
                        title='Nouveau client inscrit',
                        message=f"Inscription de {client_name}."
                    )
                )
    except Exception as e:
        print("Erreur sync clients:", e)

    # 4. Emails Gmail : en-têtes uniquement (SUBJECT/FROM) pour ne pas saturer la RAM
    try:
        mail_user = getattr(settings, 'EMAIL_ACCOUNT_USER', 'adrwarecontact@gmail.com')
        mail_pass = getattr(settings, 'EMAIL_ACCOUNT_PASSWORD', None)

        if mail_pass:
            mail = imaplib.IMAP4_SSL('imap.gmail.com', timeout=5)
            mail.login(mail_user, mail_pass)
            mail.select('inbox', readonly=True)

            _, messages = mail.search(None, 'ALL')
            mail_ids = messages[0].split()[-5:]
            email_keys = [f"email-{mid.decode('utf-8')}" for mid in mail_ids]
            existing_emails = set(
                Notification.objects.filter(notification_key__in=email_keys)
                .values_list('notification_key', flat=True)
            )

            for mail_id in mail_ids:
                key = f"email-{mail_id.decode('utf-8')}"
                if key in existing_emails:
                    continue

                _, msg_data = mail.fetch(mail_id, '(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM)])')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        raw_subject = msg.get('Subject') or 'Panne / Remarque'
                        decoded_parts = decode_header(raw_subject)
                        subject, encoding = decoded_parts[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding or 'utf-8', errors='ignore')

                        from_user = msg.get('From', 'Expéditeur inconnu')
                        sub_lower = (subject or '').lower()
                        notif_type = 'panne' if any(w in sub_lower for w in ('panne', 'technique', 'urgence')) else 'proposition'

                        notifications_to_create.append(
                            Notification(
                                notification_key=key,
                                type=notif_type,
                                title=subject or 'Panne / Remarque',
                                message=f"De : {from_user}"
                            )
                        )
            mail.logout()
    except Exception as e:
        print("Erreur lors de la lecture IMAP Gmail :", e)

    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create, ignore_conflicts=True)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_admin_notifications(request):
    _sync_notifications_if_needed()

    notifications_qs = Notification.objects.order_by('-created_at')[:20]
    data = [
        {
            'id': n.notification_key,
            'type': n.type,
            'title': n.title,
            'message': n.message,
            'time': n.created_at.strftime('%d/%m/%Y %H:%M'),
            'is_read': n.is_read
        }
        for n in notifications_qs
    ]
    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_notification_read(request, notification_key):
    """Marque la notification comme lue pour TOUS les travailleurs"""
    updated = Notification.objects.filter(notification_key=notification_key).update(
        is_read=True,
        read_by=request.user.email if request.user.is_authenticated else None
    )
    if not updated:
        return Response({'error': 'Notification non trouvée'}, status=404)
    return Response({'status': 'success'}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_all_notifications_read(request):
    """Marque TOUTES les notifications comme lues pour TOUT LE MONDE"""
    Notification.objects.filter(is_read=False).update(is_read=True)
    return Response({'status': 'success'}, status=200)