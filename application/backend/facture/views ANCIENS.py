import os
import re
import socket
from datetime import datetime, date, timedelta
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import urllib.parse
from django.utils import timezone
from .models import Facture
from numeros_pin.models import NumeroPinMobile
from .serializers import FactureSerializer
from accounts.models import CustomUser


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


@api_view(['GET'])
def get_server_ip(request):
    return Response({'ip': get_local_ip()})


@api_view(['POST'])
@permission_classes([AllowAny])
def send_invoice_email(request):
    recipient_email = request.data.get('email')
    subject = request.data.get('subject')
    message_text = request.data.get('message')
    invoice_id = request.data.get('invoice_id')
    invoice_ids = request.data.get('invoice_ids')

    if not recipient_email or (not invoice_id and not invoice_ids):
        return Response(
            {"error": "L'adresse email et l'ID de la facture sont requis."},
            status=status.HTTP_400_BAD_REQUEST
        )

    ids_to_fetch = invoice_ids if invoice_ids else [invoice_id]
    factures = Facture.objects.select_related('reservation', 'reservation__car').filter(pk__in=ids_to_fetch)

    if not factures.exists():
        return Response(
            {"error": "Facture(s) introuvable(s)."},
            status=status.HTTP_404_NOT_FOUND
        )

    if any(f.statut == 'En attente' for f in factures):
        return Response(
            {"error": "Impossible d'envoyer une facture sans aucun règlement enregistré."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        sender_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@adrware.mg')
        
        total_price_sum = sum(float(f.reservation.total_price if f.reservation and f.reservation.total_price else f.total or 0) for f in factures)
        montant_paye_sum = sum(float(f.montant_paye or 0) for f in factures)
        reste_a_payer_sum = sum(float(f.reste_a_payer or max(0, (f.reservation.total_price if f.reservation else 0) - f.montant_paye)) for f in factures)
        
        reference_str = ", ".join([f.reference for f in factures])

        current_host = request.get_host()
        scheme = request.scheme
        first_facture = factures.first()
        verify_url = f"{scheme}://{current_host}/verify?id={first_facture.id}&ref={first_facture.reference}"
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=130x130&data={urllib.parse.quote(verify_url)}"

        is_combined = len(factures) > 1

        items_html = ""
        for f in factures:
            res = f.reservation
            car = getattr(res, 'car', None)
            car_name = getattr(res, 'car_name', getattr(car, 'name', 'Véhicule'))
            car_category = getattr(res, 'car_category', getattr(car, 'category', 'Berline'))
            car_registration = getattr(res, 'car_registration', getattr(car, 'registration', 'N/A'))
            duration_days = getattr(res, 'duration_days', getattr(res, 'days', 1))
            start_date = getattr(res, 'start_date', getattr(res, 'date_debut', ''))
            end_date = getattr(res, 'end_date', getattr(res, 'date_fin', ''))
            item_total = float(getattr(res, 'total_price', f.total or 0))

            car_image_url = ""
            relative_image_path = ""
            if car and hasattr(car, 'image') and car.image:
                relative_image_path = car.image.url
            elif hasattr(res, 'car_image') and res.car_image:
                relative_image_path = res.car_image

            if relative_image_path:
                if relative_image_path.startswith('http'):
                    car_image_url = relative_image_path
                else:
                    car_image_url = f"{scheme}://{current_host}{relative_image_path}"

            img_tag = f'<img src="{car_image_url}" alt="{car_name}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" />' if car_image_url else '<span style="color: #94a3b8; font-size: 11px;">Pas d\'image</span>'

            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">{img_tag}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #1e293b; font-size: 14px;">{car_name}</strong><br/>
                    <span style="font-size: 11px; color: #64748b;">Cat: {car_category} | Immat: {car_registration}</span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #475569;">
                    Du : {start_date}<br/>Au : {end_date} ({duration_days} j)
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1e293b; font-size: 14px;">
                    {item_total:,.2f} Ar
                </td>
            </tr>
            """

        single_car_block = ""
        if not is_combined and factures.count() == 1:
            f = factures.first()
            res = f.reservation
            car = getattr(res, 'car', None)
            car_name = getattr(res, 'car_name', 'Véhicule')
            car_image_url = ""
            relative_image_path = ""
            if car and hasattr(car, 'image') and car.image:
                relative_image_path = car.image.url
            elif hasattr(res, 'car_image') and res.car_image:
                relative_image_path = res.car_image

            if relative_image_path:
                if relative_image_path.startswith('http'):
                    car_image_url = relative_image_path
                else:
                    car_image_url = f"{scheme}://{current_host}{relative_image_path}"

            single_car_block = f"""
            <div style="background-color: #f8fafc; border-radius: 14px; padding: 25px; margin-top: 25px; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e3a8a; margin-top: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; letter-spacing: 0.5px;">Véhicule Réservé & Synthèse</h3>
                {f'<div style="text-align: center; margin: 20px 0;"><img src="{car_image_url}" alt="{car_name}" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" /></div>' if car_image_url else ''}
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px;">
                    <tr><td style="padding: 8px 0; color: #64748b;">Véhicule :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1e293b;">{car_name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Réf. Facture :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #2563eb;">{f.reference}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Montant Total :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1e293b;">{float(f.reservation.total_price if f.reservation and f.reservation.total_price else f.total):,.2f} Ar</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Montant Réglé :</td><td style="padding: 8px 0; font-weight: bold; color: #16a34a; text-align: right;">{float(f.montant_paye):,.2f} Ar</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Reste à Payer :</td><td style="padding: 8px 0; font-weight: bold; color: #dc2626; text-align: right; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">{float(f.reste_a_payer):,.2f} Ar</td></tr>
                </table>
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center;">
                    <img src="{qr_code_url}" alt="QR Code Facture" style="width: 110px; height: 110px; border: 2px solid #2563eb; padding: 4px; border-radius: 12px; background: #ffffff;" />
                    <p style="font-size: 11px; color: #64748b; margin-top: 8px; font-weight: 600;">Scannez ce QR code pour authentifier votre facture en ligne.</p>
                </div>
            </div>
            """

        multi_car_block = ""
        if is_combined:
            multi_car_block = f"""
            <div style="background-color: #f8fafc; border-radius: 14px; padding: 25px; margin-top: 25px; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e3a8a; margin-top: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; letter-spacing: 0.5px;">Détails des Prestations (Véhicules multiples)</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #1e293b; color: #ffffff;">
                            <th style="padding: 10px; text-align: center;">Photo</th>
                            <th style="padding: 10px; text-align: left;">Véhicule & Caractéristiques</th>
                            <th style="padding: 10px; text-align: center;">Période</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px; border-top: 2px solid #cbd5e1; padding-top: 15px;">
                    <tr><td style="padding: 8px 0; color: #64748b;">Montant Total (Ensemble) :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1e293b;">{total_price_sum:,.2f} Ar</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Montant Réglé :</td><td style="padding: 8px 0; font-weight: bold; color: #16a34a; text-align: right;">{montant_paye_sum:,.2f} Ar</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Reste à Payer :</td><td style="padding: 8px 0; font-weight: bold; color: #dc2626; text-align: right;">{reste_a_payer_sum:,.2f} Ar</td></tr>
                </table>
            </div>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px;">
            <div style="max-width: 620px; margin: auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.08);">
                
                <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 35px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ADRWARE Car Rental</h1>
                    <p style="color: #93c5fd; font-size: 12px; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Service Officiel de Facturation ({reference_str})</p>
                </div>

                <div style="padding: 35px; color: #334155;">
                    <p style="white-space: pre-line; color: #475569; font-size: 15px; line-height: 1.8; margin-top: 0;">{message_text}</p>
                    
                    {single_car_block}
                    {multi_car_block}
                </div>
            </div>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(
            subject=subject or f"Facture Officielle {reference_str} - ADRWARE Car Rental",
            body=message_text,
            from_email=sender_email,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        return Response({"message": "Email envoyé avec succès !"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": f"Erreur lors de l'envoi de l'email : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class FactureViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = FactureSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['reference', 'statut', 'mode_paiement', 'reservation__client_name', 'reservation__car_name']

    def get_queryset(self):
        today = timezone.now().date()

        # Marquer automatiquement comme expirée/annulée la réservation et la facture en cas de non-paiement à la date de début
        factures_perimees = Facture.objects.select_related('reservation').filter(
            Q(reservation__status__iexact='validated') | 
            Q(reservation__status__iexact='validée') |
            Q(reservation__status__iexact='confirmée') |
            Q(reservation__status__iexact='confirmee'),
            statut='En attente',
            montant_paye=0,
            reservation__start_date__lt=today
        )

        for f in factures_perimees:
            if f.reservation:
                f.reservation.status = 'annulée'  # Réservation annulée / expirée pour non-paiement
                f.reservation.save()
            f.statut = 'Annulée'
            f.save()

        # Inclure tous les statuts valides, confirmés, en cours et terminés pour la facturation
        queryset = Facture.objects.select_related('reservation', 'reservation__car').filter(
            Q(reservation__status__iexact='validated') | 
            Q(reservation__status__iexact='validée') |
            Q(reservation__status__iexact='confirmée') |
            Q(reservation__status__iexact='confirmee') |
            Q(reservation__status__iexact='en cours') |
            Q(reservation__status__iexact='terminée') |
            Q(reservation__status__iexact='terminee')
        ).exclude(
            statut='Annulée'
        )

        user = self.request.user
        client_email = self.request.query_params.get('client_email') or self.request.query_params.get('email')

        if client_email:
            queryset = queryset.filter(
                Q(reservation__client_email__iexact=client_email) | 
                Q(reservation__client__email__iexact=client_email)
            )
        elif user and user.is_authenticated and not user.is_staff:
            email = getattr(user, 'email', None)
            user_filters = Q()
            if email:
                user_filters |= Q(reservation__client_email__iexact=email) | Q(reservation__client__email__iexact=email)
            if hasattr(user, 'id') and isinstance(user.id, int):
                user_filters |= Q(reservation__client=user.id)
            if user_filters:
                queryset = queryset.filter(user_filters)

        return queryset.order_by('-id')

    def _valider_et_enregistrer_pin(self, user, telephone, pin_code, strict_existence=False):
        if not telephone or not pin_code or len(str(pin_code)) != 4:
            raise ValidationError({"error": "Le numéro de téléphone et le code PIN à 4 chiffres sont obligatoires."})

        telephone_clean = str(telephone).strip()
        pin_clean = str(pin_code).strip()

        existing_num = NumeroPinMobile.objects.filter(telephone=telephone_clean).first()

        if strict_existence:
            if not existing_num:
                raise ValidationError({
                    "error": f"Le numéro {telephone_clean} n'a jamais effectué de dépôt. Veuillez d'abord effectuer un dépôt."
                })
            if existing_num.code_pin != pin_clean:
                raise ValidationError({
                    "error": f"Code PIN incorrect pour le numéro {telephone_clean}."
                })
        else:
            if existing_num:
                if existing_num.code_pin != pin_clean:
                    raise ValidationError({
                        "error": f"Code PIN incorrect pour le numéro {telephone_clean}. Dépôt refusé."
                    })
            else:
                NumeroPinMobile.objects.create(
                    user=user,
                    telephone=telephone_clean,
                    code_pin=pin_clean
                )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def depot_argent(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            client_email = request.data.get('email') or request.query_params.get('client_email')
            if client_email:
                user = CustomUser.objects.filter(email__iexact=client_email).first()

        if not user or not user.is_authenticated:
            return Response({"error": "Utilisateur non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)

        montant = request.data.get('montant')
        telephone = request.data.get('telephone')
        pin_code = request.data.get('code_secret_pin')

        try:
            montant = float(montant)
        except (TypeError, ValueError):
            return Response({"error": "Montant de dépôt invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if montant < 1000:
            return Response({"error": "Le montant minimum pour un dépôt est de 1 000 AR."}, status=status.HTTP_400_BAD_REQUEST)

        self._valider_et_enregistrer_pin(user, telephone, pin_code, strict_existence=False)

        current_solde = float(getattr(user, 'solde_depot', 0.0))
        new_solde = current_solde + montant
        
        if hasattr(user, 'solde_depot'):
            user.solde_depot = new_solde
            user.save()

        return Response({
            "message": f"Dépôt de {montant:,.0f} AR effectué avec succès.",
            "nouveau_solde": new_solde
        }, status=status.HTTP_200_OK)

    @transaction.atomic
    def perform_update(self, serializer):
        mode_paiement = self.request.data.get('mode_paiement', '')
        pin_code = self.request.data.get('code_secret_pin')
        telephone = self.request.data.get('telephone_paiement') or self.request.data.get('telephone')
        montant_paye_demandé = self.request.data.get('montant_paye')
        client_email_recu = self.request.data.get('client_email')
        
        instance = self.get_object()
        user = self.request.user

        if not user or not user.is_authenticated:
            if client_email_recu:
                user = CustomUser.objects.filter(email__iexact=client_email_recu).first()
            elif instance.reservation and getattr(instance.reservation, 'client_email', None):
                user = CustomUser.objects.filter(email__iexact=instance.reservation.client_email).first()
            
            if not user and telephone:
                user = CustomUser.objects.filter(phone_number=telephone, solde_depot__gt=0).first()
                if not user:
                    user = CustomUser.objects.filter(phone_number=telephone).first()

        mode_lower = str(mode_paiement).lower().strip()
        
        if mode_paiement and 'Espèces' not in mode_paiement:
            self._valider_et_enregistrer_pin(user, telephone, pin_code, strict_existence=True)

        if montant_paye_demandé is not None:
            try:
                nouveau_total = float(montant_paye_demandé)
                ancien_total = float(instance.montant_paye or 0.0)
                versement = nouveau_total - ancien_total

                if versement > 0:
                    if versement < 1000:
                        raise ValidationError({"error": "Le versement minimum accepté est de 1 000 AR."})

                    caution_requise = float(getattr(instance, 'montant_caution', 0.0))
                    if ancien_total == 0 and caution_requise > 0 and versement < caution_requise:
                        raise ValidationError({
                            "error": f"Le premier règlement doit obligatoirement couvrir la caution d'un montant de {caution_requise:,.0f} AR."
                        })

                    if user and hasattr(user, 'solde_depot'):
                        current_solde = float(user.solde_depot)
                        if current_solde < versement:
                            raise ValidationError({
                                "error": f"Fonds insuffisants ! Votre solde est de {current_solde:,.0f} AR, mais le versement requis est de {versement:,.0f} AR."
                            })
                        
                        user.solde_depot = current_solde - versement
                        user.save(update_fields=['solde_depot'])
            except ValueError:
                pass

        serializer.save()