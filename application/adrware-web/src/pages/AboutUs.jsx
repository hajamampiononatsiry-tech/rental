import React from 'react';
import { 
  Building2, 
  Award, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Car, 
  Headphones, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard, 
  Shield, 
  Navigation, 
  Compass 
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

export default function AboutUs() {
  const { language } = useLanguage();

  // Dictionnaire multilingue professionnel (FR, EN, MG)
  const t = {
    fr: {
      flyerTitle: "Présentation Institutionnelle & Offres Officielles",
      flyerSubtitle: "Document synthétique format A4 paysage, conçu pour une lecture fluide, élégante et percutante.",
      printBtn: "Imprimer le Document A4",
      heroTitle: "ADRWARE AutoRental — Votre Partenaire Privilégié de Mobilité",
      heroDesc: "Location de véhicules récents, entièrement révisés et sécurisés pour tous vos déplacements professionnels ou touristiques.",
      brandSub: "AutoRental",
      stats: [
        { label: 'Véhicules récents', value: '50+' },
        { label: 'Clients satisfaits', value: '2 500+' },
        { label: 'Expérience', value: '5 Ans' },
        { label: 'Assistance 24/7', value: '7j/7' }
      ],
      sectionRentOffers: "Nos Offres de Location",
      services: [
        { title: 'Courte & Longue Durée', desc: 'Formules flexibles pour particuliers, professionnels et séjours touristiques.' },
        { title: 'Avec ou Sans Chauffeur', desc: 'Chauffeurs professionnels expérimentés pour vos déplacements et voyages.' },
        { title: 'Transferts Aéroport & Ville', desc: 'Navettes rapides, accueil personnalisé à l’arrivée et ponctualité garantie.' }
      ],
      sectionFleet: "Notre Flotte Automobile",
      fleet: [
        { cat: 'Économique', ex: 'Peugeot 208, Renault Clio' },
        { cat: 'Berline Confort', ex: 'Toyota Corolla, Volkswagen Passat' },
        { cat: 'SUV & 4x4 Tout-Terrain', ex: 'Toyota Prado, Duster 4x4' },
        { cat: 'Utilitaire & Pick-up', ex: 'Toyota Hilux, Isuzu D-Max' }
      ],
      sectionGuarantees: "Garanties & Inclusions",
      assurancesAndOptions: [
        { title: 'Assurance & Protection', desc: 'Couverture tous risques, responsabilité civile et protection vol incluses.' },
        { title: 'Équipements Inclus', desc: 'Climatisation, GPS, siège bébé sur demande, 2ᵉ conducteur offert.' },
        { title: 'Paiement Souple', desc: 'CB, Espèces, Virement bancaire et Mobile Money acceptés.' }
      ],
      sectionReservation: "Réservation (4 Étapes)",
      reservationSteps: [
        { step: '1', title: 'Sélection', desc: 'Choix du véhicule' },
        { step: '2', title: 'Devis', desc: 'Tarif transparent' },
        { step: '3', title: 'Contrat', desc: 'Validation & Caution' },
        { step: '4', title: 'Départ', desc: 'Remise des clés' }
      ],
      sectionFaq: "Conditions Clés",
      faqs: [
        { q: 'Pièces à fournir ?', a: 'Pièce d’identité (CIN/Passeport) + Permis valide de plus de 2 ans.' },
        { q: 'Conditions de Caution ?', a: 'Empreinte bancaire ou dépôt restituable dès le retour conforme du véhicule.' },
        { q: 'Politique Carburant ?', a: 'Véhicule livré avec le plein et à restituer au même niveau d’essence.' }
      ],
      assistanceTitle: "Assistance Routière & Dépannage 24/7 :",
      assistanceText: "Intervention rapide au",
      assistanceSuffix: "Remplacement de véhicule sous 24h.",
      location: "Antananarivo, Madagascar",
      hours: "Lun–Sam: 8h–18h"
    },
    en: {
      flyerTitle: "Institutional Presentation & Official Offers",
      flyerSubtitle: "A4 landscape summary document designed for smooth, elegant, and impactful reading.",
      printBtn: "Print A4 Document",
      heroTitle: "ADRWARE AutoRental — Your Preferred Mobility Partner",
      heroDesc: "Rental of recent vehicles, fully inspected and secured for all your business or leisure trips.",
      brandSub: "AutoRental",
      stats: [
        { label: 'Recent vehicles', value: '50+' },
        { label: 'Satisfied clients', value: '2,500+' },
        { label: 'Experience', value: '5 Years' },
        { label: '24/7 Support', value: '7d/7' }
      ],
      sectionRentOffers: "Our Rental Offers",
      services: [
        { title: 'Short & Long Term', desc: 'Flexible formulas for individuals, professionals and tourist stays.' },
        { title: 'With or Without Driver', desc: 'Experienced professional drivers for your trips and travels.' },
        { title: 'Airport & City Transfers', desc: 'Fast shuttles, personalized welcome upon arrival and guaranteed punctuality.' }
      ],
      sectionFleet: "Our Car Fleet",
      fleet: [
        { cat: 'Economic', ex: 'Peugeot 208, Renault Clio' },
        { cat: 'Comfort Sedan', ex: 'Toyota Corolla, Volkswagen Passat' },
        { cat: 'SUV & All-Terrain 4x4', ex: 'Toyota Prado, Duster 4x4' },
        { cat: 'Utility & Pick-up', ex: 'Toyota Hilux, Isuzu D-Max' }
      ],
      sectionGuarantees: "Guarantees & Inclusions",
      assurancesAndOptions: [
        { title: 'Insurance & Protection', desc: 'Comprehensive coverage, third-party liability and theft protection included.' },
        { title: 'Included Equipment', desc: 'Air conditioning, GPS, baby seat upon request, 2nd driver free.' },
        { title: 'Flexible Payment', desc: 'Credit card, Cash, Bank transfer and Mobile Money accepted.' }
      ],
      sectionReservation: "Reservation (4 Steps)",
      reservationSteps: [
        { step: '1', title: 'Selection', desc: 'Vehicle choice' },
        { step: '2', title: 'Quote', desc: 'Transparent pricing' },
        { step: '3', title: 'Contract', desc: 'Validation & Deposit' },
        { step: '4', title: 'Departure', desc: 'Key handover' }
      ],
      sectionFaq: "Key Conditions",
      faqs: [
        { q: 'Required documents?', a: 'ID card/Passport + Valid driver license over 2 years.' },
        { q: 'Deposit conditions?', a: 'Bank imprint or refundable deposit upon proper return of the vehicle.' },
        { q: 'Fuel policy?', a: 'Vehicle delivered with full tank and to be returned at the same level.' }
      ],
      assistanceTitle: "Roadside Assistance & 24/7 Breakdown:",
      assistanceText: "Fast intervention at",
      assistanceSuffix: "Vehicle replacement within 24 hours.",
      location: "Antananarivo, Madagascar",
      hours: "Mon–Sat: 8am–6pm"
    },
    mg: {
      flyerTitle: "Fampisehoana Andrimpanjakana & Tolotra Ofisialy",
      flyerSubtitle: "Antontan-taratasy A4 mandry natokana ho an'ny famakiana mora, mendrika ary mazava tsara.",
      printBtn: "Aontaovy ny Antontan-taratasy A4",
      heroTitle: "ADRWARE AutoRental — Mpiara-miombon'antoka Amin'ny Fandehananao",
      heroDesc: "Fanofana fiara vaovao, voatsiraka tsara ary azo antoka ho an'ny dianao matihanina na fizahan-tany.",
      brandSub: "AutoRental",
      stats: [
        { label: 'Fiara vaovao', value: '50+' },
        { label: 'Mpanjifa afa-po', value: '2 500+' },
        { label: 'Traikefa', value: '5 Taona' },
        { label: 'Fanampiana 24/7', value: '7 andro/7' }
      ],
      sectionRentOffers: "Tolotra Fanofana Fiara",
      services: [
        { title: 'Fohy & Ela Vola', desc: 'Fepetra mora ho an’ny tsirairay, matihanina ary ny fizahan-tany.' },
        { title: 'Misy na Tsy Misy Mamily', desc: 'Mpamily matihanina efa za-draharaha ho an’ny dianao sy ny dia lavitra.' },
        { title: 'Famindrana Eorôport & An-drenivohitra', desc: 'Fitaterana haingana, fandraisana tsara rehefa tonga ary antoka ny fahatongavana ara-potoana.' }
      ],
      sectionFleet: "Ny Fiaranay",
      fleet: [
        { cat: 'Ara-toekarena', ex: 'Peugeot 208, Renault Clio' },
        { cat: 'Berline Mahazo aina', ex: 'Toyota Corolla, Volkswagen Passat' },
        { cat: 'SUV & 4x4 Rehetra', ex: 'Toyota Prado, Duster 4x4' },
        { cat: 'Fitatitra & Pick-up', ex: 'Toyota Hilux, Isuzu D-Max' }
      ],
      sectionGuarantees: "Antoka & Zavatra tafiditra",
      assurancesAndOptions: [
        { title: 'Fiantohana & Fiarovana', desc: 'Fiarovana tanteraka, andraikitra sivily ary fiarovana amin’ny halatra.' },
        { title: 'Fitaovana Tafiditra', desc: 'Vata fampangatsiahana, GPS, seza zaza raha angatahina, mpamily faharoa maimaim-poana.' },
        { title: 'Fandoavam-bola Mora', desc: 'Karatra banky, Vola nafindra, Banky ary Mobile Money voaray.' }
      ],
      sectionReservation: "Famandrihana (Dingana 4)",
      reservationSteps: [
        { step: '1', title: 'Safidy', desc: 'Safidy fiara' },
        { step: '2', title: 'Vola tombana', desc: 'Vidiny mazava' },
        { step: '3', title: 'Fifanarahana', desc: 'Fankatoavana & Antoka' },
        { step: '4', title: 'Fiandohana', desc: 'Fanolorana fanalahidy' }
      ],
      sectionFaq: "Fepetra Lehibe",
      faqs: [
        { q: 'Taratasy ilaina ?', a: 'Karapanondro/Pasipaoro + Fahazoan-dalana mamily mihoatra ny 2 taona.' },
        { q: 'Fepetra momba ny Antoka ?', a: 'Fametrahana antoka amin’ny banky na vola averina rehefa tafaverina tsara ny fiara.' },
        { q: 'Politika momba ny Solika ?', a: 'Fiara omena feno solika ary averina amin’ny toerany ihany koa.' }
      ],
      assistanceTitle: "Fanampiana An-dalana & Vonjy Taitra 24/7 :",
      assistanceText: "Fandraisana an-tanana haingana amin’ny",
      assistanceSuffix: "Fanoloana fiara ao anatin'ny 24 ora.",
      location: "Antananarivo, Madagasikara",
      hours: "Alatsin-Alah: 8h–18h"
    }
  };

  const texts = t[language] || t.fr;

  const statsIcons = [Car, Users, Award, Headphones];
  const servicesIcons = [Car, Building2, Compass];
  const optionsIcons = [Shield, Navigation, CreditCard];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 text-gray-800 dark:text-gray-100 font-sans print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-gray-900">
      
      {/* Configuration Impression A4 Paysage Aérée et Lisible (Taille de police augmentée à 12pt) */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0mm;
          }
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #1f2937 !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          .print-page-wrapper {
            padding: 8mm 10mm 4mm 10mm !important;
            min-height: 210mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Barre d'action Écran */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{texts.flyerTitle}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{texts.flyerSubtitle}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{texts.printBtn}</span>
        </button>
      </div>

      {/* DOCUMENT A4 IMPRESSION PAYSAGE */}
      <div className="print-page-wrapper space-y-3.5 print:space-y-3">
        
        {/* EN-TÊTE / HERO BANNER */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white p-5 print:p-4 print:rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl print:text-[22pt] font-bold tracking-tight leading-tight text-white">
                {texts.heroTitle}
              </h1>
              <p className="text-sm md:text-base print:text-[12.5pt] text-blue-50 font-normal leading-snug">
                {texts.heroDesc}
              </p>
            </div>

            {/* Logo d'entreprise */}
            <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
              <img src={logo} alt="Logo ADRWARE" className="w-12 h-12 print:w-11 print:h-11 object-contain rounded-lg bg-white p-1 shadow-sm" />
              <div className="pr-2">
                <span className="block font-bold text-base print:text-[13pt] text-white leading-none">ADRWARE</span>
                <span className="text-[10px] print:text-[9pt] text-blue-100 uppercase tracking-widest font-semibold">{texts.brandSub}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHIFFRES CLÉS */}
        <div className="grid grid-cols-4 gap-3 print:gap-3">
          {texts.stats.map((item, idx) => {
            const Icon = statsIcons[idx];
            return (
              <div key={idx} className="bg-white dark:bg-gray-800 p-3 print:p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 shadow-sm">
                <div className="p-2.5 print:p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <Icon className="w-5 h-5 print:w-5 print:h-5" />
                </div>
                <div>
                  <p className="text-base md:text-lg print:text-[14pt] font-bold text-gray-800 dark:text-gray-100 leading-none">{item.value}</p>
                  <p className="text-xs md:text-sm print:text-[10.5pt] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-tight">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CORPS PRINCIPAL EN 2 COLONNES ÉLARGIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print-avoid-break">
          
          {/* COLONNE GAUCHE : Offres & Flotte */}
          <div className="space-y-3 print:space-y-3">
            
            {/* Offres de Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-1.5">
                <h2 className="text-xs md:text-sm print:text-[12pt] font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                  {texts.sectionRentOffers}
                </h2>
              </div>
              <div className="space-y-2 print:space-y-2">
                {texts.services.map((srv, idx) => {
                  const Icon = servicesIcons[idx];
                  return (
                    <div key={idx} className="p-2.5 print:p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-3 shadow-sm">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 print:w-4 print:h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs md:text-sm print:text-[11pt] font-bold text-gray-800 dark:text-gray-100">{srv.title}</h3>
                        <p className="text-xs md:text-sm print:text-[10pt] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">{srv.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flotte Automobile */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-1.5">
                <h2 className="text-xs md:text-sm print:text-[12pt] font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                  {texts.sectionFleet}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 print:gap-2">
                {texts.fleet.map((item, idx) => (
                  <div key={idx} className="p-2.5 print:p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-xs md:text-sm print:text-[11pt] font-bold text-gray-800 dark:text-gray-100">{item.cat}</p>
                    <p className="text-xs print:text-[9.5pt] font-normal text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{item.ex}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLONNE DROITE : Garanties, Réservation & FAQ */}
          <div className="space-y-3 print:space-y-3">
            
            {/* Garanties & Options */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-1.5">
                <h2 className="text-xs md:text-sm print:text-[12pt] font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                  {texts.sectionGuarantees}
                </h2>
              </div>
              <div className="space-y-1.5 print:space-y-1.5">
                {texts.assurancesAndOptions.map((item, idx) => {
                  const Icon = optionsIcons[idx];
                  return (
                    <div key={idx} className="p-2 print:p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-2.5 shadow-sm">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 print:w-4 print:h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs md:text-sm print:text-[11pt] font-bold text-gray-800 dark:text-gray-100">{item.title}</h3>
                        <p className="text-xs md:text-sm print:text-[10pt] text-gray-500 dark:text-gray-400 leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Étapes & Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:grid-cols-2 print:gap-2">
              
              {/* Procédure */}
              <div className="space-y-1.5">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-1.5">
                  <h2 className="text-xs md:text-sm print:text-[11pt] font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                    {texts.sectionReservation}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-1.5 print:gap-1.5">
                  {texts.reservationSteps.map((st, idx) => (
                    <div key={idx} className="p-1.5 print:p-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] print:text-[9pt] font-bold bg-blue-600 text-white mb-0.5">
                        {st.step}
                      </span>
                      <p className="text-xs print:text-[9.5pt] font-bold text-gray-800 dark:text-gray-100 leading-tight">{st.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Express */}
              <div className="space-y-1.5">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-1.5">
                  <h2 className="text-xs md:text-sm print:text-[11pt] font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                    {texts.sectionFaq}
                  </h2>
                </div>
                <div className="space-y-1 print:space-y-1">
                  {texts.faqs.slice(0, 2).map((faq, idx) => (
                    <div key={idx} className="p-1.5 print:p-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <p className="text-xs print:text-[9.5pt] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{faq.q}</span>
                      </p>
                      <p className="text-[11px] print:text-[9pt] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ASSISTANCE & DEPANNAGE */}
        <div className="p-3 print:p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-3 print-avoid-break">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 print:w-4.5 print:h-4.5" />
          </div>
          <p className="text-xs md:text-sm print:text-[11pt] text-amber-900 dark:text-amber-200 leading-snug">
            <strong>{texts.assistanceTitle}</strong> {texts.assistanceText} <strong>+261 38 93 346 87</strong>. {texts.assistanceSuffix}
          </p>
        </div>

        {/* PIED DE PAGE IMPRESSION LARGE ET LISIBLE */}
        <div className="bg-gray-900 text-white p-3.5 print:p-3 print:rounded-xl print:m-0 print:w-full flex items-center justify-between text-xs md:text-sm print:text-[11pt] font-semibold print-avoid-break shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{texts.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-bold text-blue-200">+261 38 93 346 87</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            <span>adrwarecontact@gmail.com</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{texts.hours}</span>
          </div>
        </div>

      </div>

    </div>
  );
}