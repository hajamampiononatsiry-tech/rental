import re
from datetime import date, datetime
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from facture.models import Facture
from fleet.models import Car
from reservation.models import Reservation


def _to_date(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        clean_str = val.split('T')[0].split(' ')[0].strip()
        try:
            return datetime.strptime(clean_str, '%Y-%m-%d').date()
        except Exception:
            return None
    return None


def parse_natural_dates(text):
    full_dates = re.findall(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', text)
    parsed_dates = []

    for d_str in full_dates:
        parts = re.split(r'[-/]', d_str)
        if len(parts) == 3:
            try:
                p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
                if p3 < 100:
                    p3 += 2000
                if p1 > 1000:
                    parsed_dates.append(date(p1, p2, p3))
                else:
                    parsed_dates.append(date(p3, p2, p1))
            except Exception:
                pass

    if len(parsed_dates) >= 2:
        return min(parsed_dates), max(parsed_dates)
    if len(parsed_dates) == 1:
        return parsed_dates[0], parsed_dates[0]

    months = {
        'janvier': 1, 'février': 2, 'fevrier': 2, 'mars': 3, 'avril': 4,
        'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8, 'aout': 8,
        'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12, 'decembre': 12
    }
    found_month = next((m_num for m_name, m_num in months.items() if m_name in text), None)

    if found_month:
        days = re.findall(r'\b(\d{1,2})\b', text)
        current_year = date.today().year
        if len(days) >= 2:
            try:
                return date(current_year, found_month, int(days[0])), date(current_year, found_month, int(days[1]))
            except Exception:
                pass
        elif len(days) == 1:
            try:
                return date(current_year, found_month, int(days[0])), date(current_year, found_month, int(days[0]))
            except Exception:
                pass

    return None, None


class CompanyAIAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = str(request.data.get('message') or '').strip()
        has_image = bool(request.data.get('has_image', False))
        user = request.user

        if has_image:
            return Response({
                "reply": (
                    "📸 **ANALYSE DE PHOTO — ADRWARE**\n\n"
                    "J'ai bien reçu votre image. En tant qu'assistant de l'agence, je peux observer le contenu visuel transmis "
                    "(état du véhicule, document ou élément de flotte).\n\n"
                    "💡 _Pour un traitement prioritaire, contactez notre support au +261 38 93 346 87._"
                ),
                "status": "success"
            })

        if not user_message:
            return Response({
                "reply": "🚗 **ADRWARE AutoRental**\n\nBonjour. Comment puis-je vous assister aujourd'hui au sein de notre agence ?",
                "status": "success"
            })

        msg_lower = user_message.lower()
        words = msg_lower.split()

        # Chargement unique de la flotte en mémoire pour éviter les requêtes répétées
        try:
            cars_list = list(Car.objects.all())
        except Exception:
            cars_list = []

        # Salutations & détection linguistique
        if any(w in words for w in ['salama', 'mbola', 'tsara', 'akory', 'misaotra', 'mbola tsara']):
            nom = f" {user.first_name}" if user.first_name else ""
            return Response({
                "reply": f"✨ **ADRWARE AutoRental**\n\nSalama{nom} ! Tonga soa eto amin'ny ADRWARE. Ahoana no ahafahanay manampy anao androany momba ireo fiara, famandrihana na faktiora?",
                "status": "success"
            })

        if any(w in words for w in ['hello', 'hi', 'car', 'cars', 'status', 'price', 'reservation', 'invoice']):
            nom = f" {user.first_name}" if user.first_name else ""
            return Response({
                "reply": f"✨ **ADRWARE AutoRental**\n\nHello{nom}! Welcome to ADRWARE AutoRental. How can we assist you with our fleet, bookings, or invoices today?",
                "status": "success"
            })

        if any(w in words for w in ['bonjour', 'salut', 'coucou', 'bonsoir', 'hey']):
            nom = f" {user.first_name}" if user.first_name else ""
            return Response({
                "reply": f"✨ **ADRWARE AutoRental**\n\nBonjour{nom} ! C'est un plaisir de vous accueillir. Comment puis-je vous accompagner avec notre flotte, vos réservations ou vos factures ?",
                "status": "success"
            })

        if any(w in msg_lower for w in ['ca va', 'ça va', 'comment ca va', 'comment ça va']):
            client_name = user.first_name or 'cher client'
            return Response({
                "reply": f"🌟 **ADRWARE AutoRental**\n\nJe vais très bien, {client_name}, je vous remercie ! Toute notre équipe se tient à votre entière disposition.",
                "status": "success"
            })

        # Coordonnées de l'agence
        if any(w in msg_lower for w in ['contact', 'contacts', 'coordonnee', 'coordonnées', 'telephone', 'téléphone', 'email', 'adresse', 'joindre', 'appeler']):
            return Response({
                "reply": (
                    "📞 **COORDONNÉES — ADRWARE AutoRental**\n\n"
                    "Vous pouvez nous joindre à tout moment via nos canaux officiels :\n"
                    "📍 **Adresse :** Antananarivo, Madagascar\n"
                    "📱 **Téléphone :** +261 38 93 346 87 \n"
                    "📧 **E-mail :** adrwarecontact@gmail.com\n"
                    "🕒 **Horaires :** Lundi au Samedi (8h00 - 18h00)"
                ),
                "status": "success"
            })

        # Véhicules loués
        if any(kw in msg_lower for kw in ['loue', 'loué', 'loues', 'loués', 'en location', 'occupé', 'occupes', 'occupés']):
            rented_cars = [c for c in cars_list if str(getattr(c, 'status', '')).lower() in {'en location', 'loué', 'loue'}]
            if rented_cars:
                r_list = [f"🔵 **{c.name}** — {c.price:,.0f} Ar/j _(En location)_" for c in rented_cars]
                return Response({
                    "reply": "📋 **VÉHICULES ACTUELLEMENT EN LOCATION**\n\nVoici les véhicules actuellement en cours de location :\n\n" + "\n".join(r_list),
                    "status": "success"
                })
            return Response({
                "reply": "ℹ️ Aucun véhicule n'est actuellement en location. Tous nos véhicules disponibles sont libres à la réservation !",
                "status": "success"
            })

        # Véhicules libres / disponibles
        mentions_specific_car = any(
            (getattr(c, 'name', '') or '').lower() in msg_lower
            for c in cars_list
            if getattr(c, 'name', None)
        )
        if any(kw in msg_lower for kw in ['libre', 'libres', 'dispo', 'disponible', 'disponibles']) and not mentions_specific_car:
            free_cars = [c for c in cars_list if str(getattr(c, 'status', '')).lower() == 'disponible']
            if free_cars:
                f_list = [f"🟢 **{c.name}** — {c.price:,.0f} Ar/j | {c.seats} places | {c.transmission} | {c.fuel}" for c in free_cars]
                return Response({
                    "reply": "🚗 **VÉHICULES LIBRES & DISPONIBLES**\n\nVoici la liste des véhicules immédiatement disponibles :\n\n" + "\n".join(f_list),
                    "status": "success"
                })
            return Response({
                "reply": "⚠️ Désolé, tous nos véhicules sont actuellement en location ou réservés.",
                "status": "success"
            })

        # Historique des réservations
        if any(w in msg_lower for w in ['reservation', 'réservation', 'reservations', 'réservations', 'historique', 'contrat']) and not any(w in msg_lower for w in ['libre', 'disponible', 'verifier', 'vérifier', 'du ']):
            try:
                user_email = getattr(user, 'email', '')
                user_res = Reservation.objects.select_related('car', 'client').filter(
                    Q(client=user) | Q(client_email__iexact=user_email) | Q(client__email__iexact=user_email)
                ).order_by('-created_at')[:10]

                if not user_res.exists() and (user.is_staff or user.is_superuser):
                    user_res = Reservation.objects.select_related('car', 'client').order_by('-created_at')[:10]

                if user_res.exists():
                    res_items = []
                    for r in user_res:
                        debut = getattr(r, 'start_date', getattr(r, 'date_debut', 'N/A'))
                        fin = getattr(r, 'end_date', getattr(r, 'date_fin', 'N/A'))
                        statut_r = getattr(r, 'status', getattr(r, 'statut', 'Confirmée'))
                        car_obj = getattr(r, 'car', None)
                        voiture_nom = getattr(car_obj, 'name', None) or getattr(r, 'car_name', 'Véhicule')
                        res_items.append(f"📌 **Réservation #{r.id}**\n   • Véhicule : **{voiture_nom}**\n   • Période : Du {debut} au {fin}\n   • Statut : `{statut_r}`")
                    res_str = "\n\n".join(res_items)
                else:
                    res_str = "Aucune réservation active enregistrée à votre profil ou adresse email."
            except Exception:
                res_str = "Historique momentanément indisponible."

            return Response({"reply": f"📋 **VOTRE HISTORIQUE DE RÉSERVATIONS**\n\n{res_str}", "status": "success"})

        # Factures et règlements
        if any(w in msg_lower for w in ['facture', 'factures', 'paiement', 'paiements', 'solde', 'impayé', 'impayés', 'payer']):
            try:
                factures_list = list(Facture.objects.order_by('-id')[:20])
                if factures_list:
                    total_fac_count = len(factures_list)
                    unpaid_fac = []
                    fac_items = []

                    for f in factures_list:
                        ref_f = getattr(f, 'reference', f"N°{f.id}")
                        statut_f = str(getattr(f, 'statut', 'En attente'))
                        try:
                            reste = float(getattr(f, 'reste_a_payer', 0) or 0)
                        except Exception:
                            reste = 0.0

                        if reste > 0 or statut_f.lower() not in {'payée', 'payee', 'paid'}:
                            unpaid_fac.append(f)

                        fac_items.append(
                            f"📄 **Facture {ref_f}**\n"
                            f"   • Reste à payer : **{reste:,.0f} Ar**\n"
                            f"   • Statut : `{statut_f}`"
                        )

                    if any(kw in msg_lower for kw in ['combien', 'à payer', 'impayé', 'impayés', 'reste']):
                        if unpaid_fac:
                            fac_str = f"⚠️ Vous avez **{len(unpaid_fac)} facture(s) à régler** sur un total de {total_fac_count} facture(s) récente(s)."
                        else:
                            fac_str = f"✅ Vous n'avez **aucun impayé**. Vos {total_fac_count} facture(s) récente(s) sont entièrement réglées !"
                    else:
                        fac_str = "\n\n".join(fac_items)
                else:
                    fac_str = "Aucune facture enregistrée pour le moment."
            except Exception:
                fac_str = "Module de facturation indisponible."

            return Response({"reply": f"💳 **VOS FACTURES & RÈGLEMENTS**\n\n{fac_str}", "status": "success"})

        # Véhicule spécifique + vérification des conflits de dates en base de données
        target_car = next(
            (c for c in cars_list if (getattr(c, 'name', '') or '').lower() and (getattr(c, 'name', '') or '').lower() in msg_lower),
            None
        )

        if target_car:
            status_emoji = '🟢' if target_car.status == 'Disponible' else '🔵' if target_car.status == 'En location' else '🟠'
            is_date_query = (
                any(w in msg_lower for w in ['libre', 'dispo', 'disponible', 'du', 'au', 'date', 'période', 'periode', 'reserver', 'réserver'])
                or bool(re.search(r'\d{1,2}[-/]\d{1,2}', msg_lower))
            )

            if is_date_query:
                found_start, found_end = parse_natural_dates(msg_lower)
                if found_start and found_end:
                    conflit = False
                    try:
                        existing_reservations = Reservation.objects.filter(
                            Q(car=target_car) | Q(car_id=target_car.id)
                        ).exclude(status__iexact='annulée').exclude(status__iexact='cancelled')

                        for r in existing_reservations:
                            r_start = _to_date(getattr(r, 'start_date', None) or getattr(r, 'date_debut', None))
                            r_end = _to_date(getattr(r, 'end_date', None) or getattr(r, 'date_fin', None))
                            if r_start and r_end and (r_start <= found_end) and (r_end >= found_start):
                                conflit = True
                                break
                    except Exception as e:
                        print(f"Erreur BDD : {e}")

                    car_display_name = getattr(target_car, 'name', 'Véhicule')
                    periode_str = f" du **{found_start.strftime('%d/%m/%Y')}** au **{found_end.strftime('%d/%m/%Y')}**"

                    if conflit:
                        reply_text = (
                            f"📅 **Vérification de Disponibilité**\n\n"
                            f"🚗 Véhicule : **{car_display_name}**\n"
                            f"🔴 **Statut :** Indisponible{periode_str}.\n\n"
                            f"Une réservation existe déjà sur cette période dans notre système. Veuillez choisir d'autres dates."
                        )
                    else:
                        reply_text = (
                            f"📅 **Vérification de Disponibilité**\n\n"
                            f"🚗 Véhicule : **{car_display_name}**\n"
                            f"🟢 **Statut :** Le véhicule est entièrement libre{periode_str} !\n\n"
                            f"_Vous pouvez valider votre réservation dès maintenant._"
                        )
                    return Response({"reply": reply_text, "status": "success"})

            if any(w in msg_lower for w in ['porte', 'portes', 'place', 'places', 'siege', 'siège']):
                reply_text = f"🚪 Le **{target_car.name}** dispose de **{target_car.doors} portes** et de **{target_car.seats} places**."
            elif any(w in msg_lower for w in ['tarif', 'prix', 'combien', 'ar', 'ariary']):
                reply_text = f"🏷️ Le tarif journalier du **{target_car.name}** est de **{target_car.price:,.0f} Ar / jour**."
            else:
                reply_text = (
                    f"📋 **FICHE TECHNIQUE OFFICIELLE**\n"
                    f"━━━━━━━━━━━━━━━━━━━\n"
                    f"🚘 **Modèle :** {target_car.name}\n"
                    f"{status_emoji} **Statut :** {target_car.status}\n"
                    f"🏷️ **Tarif :** {target_car.price:,.0f} Ar / jour\n"
                    f"📅 **Année :** {target_car.year}\n"
                    f"🚪 **Portes / Places :** {target_car.doors} portes | {target_car.seats} places\n"
                    f"⚙️ **Transmission :** {target_car.transmission}\n"
                    f"⛽ **Carburant :** {target_car.fuel}\n"
                    f"━━━━━━━━━━━━━━━━━━━"
                )
            return Response({"reply": reply_text, "status": "success"})

        # Recherche par mots-clés en mémoire
        stop_words = {'quelles', 'quels', 'quel', 'quelle', 'sont', 'les', 'des', 'du', 'la', 'le', 'voitures', 'voiture', 'vehicules', 'vehicule', 'est-ce', 'que', 'avez', 'vous', 'in', 'en', 'un', 'une'}
        filtered_terms = [w for w in words if w not in stop_words and len(w) > 1]

        if filtered_terms:
            matched_cars = []
            for fc in cars_list:
                haystack = " ".join([
                    str(getattr(fc, 'name', '') or ''),
                    str(getattr(fc, 'category', '') or ''),
                    str(getattr(fc, 'fuel', '') or ''),
                    str(getattr(fc, 'transmission', '') or ''),
                    str(getattr(fc, 'description', '') or ''),
                ]).lower()
                seats_val = str(getattr(fc, 'seats', '') or '')
                if any(term in haystack or (term.isdigit() and seats_val == term) for term in filtered_terms):
                    matched_cars.append(fc)

            if matched_cars:
                results_list = [
                    f"{'🟢' if fc.status == 'Disponible' else '🔵'} **{fc.name}** — {fc.price:,.0f} Ar/j _({fc.status})_ | {fc.seats} places | {fc.transmission} | {fc.fuel}"
                    for fc in matched_cars
                ]
                return Response({
                    "reply": "🔍 **RÉSULTATS DE RECHERCHE**\n\nVoici les véhicules correspondants :\n\n" + "\n".join(results_list),
                    "status": "success"
                })

        alternatives = [c for c in cars_list if str(getattr(c, 'status', '')).lower() == 'disponible'][:3] or cars_list[:3]
        if alternatives:
            alt_list = [
                f"🚗 **{alt.name}** — {alt.price:,.0f} Ar/j _({getattr(alt, 'seats', 5)} places, {getattr(alt, 'fuel', 'Essence')})_"
                for alt in alternatives
            ]
            return Response({
                "reply": "🔍 Nous n'avons actuellement pas ce modèle exact disponible dans notre flotte.\n\n💡 **Cependant, voici d'autres véhicules disponibles dans notre catalogue :**\n\n" + "\n".join(alt_list),
                "status": "success"
            })

        return Response({
            "reply": "Je suis une assistante de l'entreprise Adrware. Je ne peux répondre qu'aux questions en relation avec notre entreprise, nos véhicules, notre flotte, vos réservations et vos factures.",
            "status": "success"
        })