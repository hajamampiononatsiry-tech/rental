import React, { useState, useEffect } from 'react';
import { 
  Car, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Wrench,
  Loader2,
  Clock,
  UserCheck,
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { language } = useLanguage();

  const translations = {
    fr: {
      dashboardTitle: "Tableau de bord",
      dashboardDesc: "Aperçu en temps réel des performances de location.",
      totalCars: "Total véhicules",
      activeOrders: "Réservations actives",
      revenuePaid: "Chiffre d'Affaires (Payé)",
      unpaidRevenue: "Argent non reçu (Impayés)",
      expenses: "Dépenses (En cours & Terminées)",
      occupancyRate: "Taux d'occupation",
      chartTitle: "Statistiques des Locations",
      topCarsTitle: "Top 3 des Voitures les Plus Réservées",
      topCarsDesc: "Les véhicules phares de votre flotte",
      reservationsCount: "réservations",
      totalPeriod: "Total période :",
      reservationsUnit: "réservation(s)",
      perDay: "Par jour",
      perMonth: "Par mois",
      perYear: "Par année",
      recentOrders: "Dernières Réservations",
      last5Activities: "Les 5 dernières activités",
      noRecentOrders: "Aucune réservation récente trouvée.",
      realtimeUpdate: "Mise à jour en temps réel",
      recordsCount: "enregistrements",
      validated: "Validée",
      partial: "Partielle",
      pending: "En attente",
      canceled: "Annulée",
      unknown: "Inconnu",
      perDayLabel: "Ar / jour",
      noPlate: "Sans plaque",
      days: {
        Lun: "Lun", Mar: "Mar", Mer: "Mer", Jeu: "Jeu", Ven: "Ven", Sam: "Sam", Dim: "Dim",
        Mon: "Lun", Tue: "Mar", Wed: "Mer", Thu: "Jeu", Fri: "Ven", Sat: "Sam", Sun: "Dim",
        Lundi: "Lundi", Mardi: "Mardi", Mercredi: "Mercredi", Jeudi: "Jeudi", Vendredi: "Vendredi", Samedi: "Samedi", Dimanche: "Dimanche",
      },
      months: {
        "1": "Jan", "01": "Jan", Jan: "Jan", January: "Janvier", Janvier: "Janvier",
        "2": "Fév", "02": "Fév", Feb: "Fév", Fev: "Fév", February: "Février", Février: "Février",
        "3": "Mar", "03": "Mar", Mar: "Mar", March: "Mars", Mars: "Mars",
        "4": "Avr", "04": "Avr", Apr: "Avr", April: "Avril", Avril: "Avril",
        "5": "Mai", "05": "Mai", May: "Mai", Mai: "Mai",
        "6": "Juin", "06": "Juin", Jun: "Juin", June: "Juin",
        "7": "Juil", "07": "Juil", Jul: "Juil", July: "Juillet", Juillet: "Juillet",
        "8": "Aoû", "08": "Aoû", Aug: "Aoû", Aou: "Août", August: "Août", Août: "Août",
        "9": "Sep", "09": "Sep", Sep: "Sep", September: "Septembre", Septembre: "Septembre",
        "10": "Oct", Oct: "Oct", October: "Octobre", Octobre: "Octobre",
        "11": "Nov", Nov: "Nov", November: "Novembre", Novembre: "Novembre",
        "12": "Déc", Dec: "Déc", December: "Décembre", Décembre: "Décembre"
      }
    },
    en: {
      dashboardTitle: "Dashboard",
      dashboardDesc: "Real-time overview of rental performance.",
      totalCars: "Total Vehicles",
      activeOrders: "Active Bookings",
      revenuePaid: "Revenue (Paid)",
      unpaidRevenue: "Unpaid Revenue (Due)",
      expenses: "Expenses (In Progress & Completed)",
      occupancyRate: "Occupancy Rate",
      chartTitle: "Booking Statistics",
      topCarsTitle: "Top 3 Most Rented Cars",
      topCarsDesc: "Flagship vehicles of your fleet",
      reservationsCount: "bookings",
      totalPeriod: "Total period:",
      reservationsUnit: "booking(s)",
      perDay: "Per day",
      perMonth: "Per month",
      perYear: "Per year",
      recentOrders: "Recent Bookings",
      last5Activities: "The last 5 activities",
      noRecentOrders: "No recent bookings found.",
      realtimeUpdate: "Real-time update",
      recordsCount: "records",
      validated: "Validated",
      partial: "Partial",
      pending: "Pending",
      canceled: "Canceled",
      unknown: "Unknown",
      perDayLabel: "Ar / day",
      noPlate: "No plate",
      days: { Lun: "Mon", Mar: "Tue", Mer: "Wed", Jeu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" },
      months: { "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun", "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" }
    },
    mg: {
      dashboardTitle: "Fitantanana Mpiandraikitra",
      dashboardDesc: "Famintinana ny asa fampindramana fiara ADRWARE.",
      totalCars: "Tontalain'ny Fiara",
      activeOrders: "Kaomandy Mandeha",
      revenuePaid: "Vola miodina (Voaloha)",
      unpaidRevenue: "Vola mbola tsy voaray ",
      expenses: "Fandaniana (Mandeha & Vita)",
      occupancyRate: "Taha-pihetsehana",
      chartTitle: "Atontan'isa Isan'andro",
      topCarsTitle: "Fiara 3 Be Mpitaky Indrindra",
      topCarsDesc: "Ireo fiara malaza sy be mpandray indrindra",
      reservationsCount: "famandrihana",
      totalPeriod: "Tontalin'ny fehi-potoana :",
      reservationsUnit: "famandrihana",
      perDay: "Isan'andro",
      perMonth: "Isam-bolana",
      perYear: "Isan-taona",
      recentOrders: "Famandrihana Farany",
      last5Activities: "Ireo asa 5 farany",
      noRecentOrders: "Tsy misy famandrihana farany hita.",
      realtimeUpdate: "Fanavaozana amin'ny fotoana tena izy",
      recordsCount: "rakitsoratra",
      validated: "Nekena",
      partial: "Manga",
      pending: "Andalam-pankatoavana",
      canceled: "Nofoanana",
      unknown: "Tsy fantatra",
      perDayLabel: "Ar / andro",
      noPlate: "Tsy misy laharana",
      days: { Lun: "Ats", Mar: "Tal", Mer: "Alar", Jeu: "Alak", Ven: "Zom", Sam: "Sab", Dim: "Alah" },
      months: { "1": "Jan", "2": "Feb", "3": "Mar", "4": "Avr", "5": "Mey", "6": "Jiona", "7": "Jolay", "8": "Aog", "9": "Sep", "10": "Okt", "11": "Nov", "12": "Des" }
    }
  };

  const t = translations[language] || translations.fr;

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('day');
  const [statsData, setStatsData] = useState({
    totalCars: 0,
    activeOrders: 0,
    dailyRevenue: 0,
    unpaidRevenue: 0,
    maintenanceCost: 0,
    occupancyRate: 0,
    chartData: [],
    recentOrders: [],
    topCars: []
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const API_BASE_URL = `http://${currentHost}:8000/api`;

  const fetchDashboardData = async (selectedPeriod = 'day', isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch(`${API_BASE_URL}/dashboard-stats/?period=${selectedPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setStatsData({
          totalCars: data.total_cars || 0,
          activeOrders: data.active_orders || 0,
          dailyRevenue: data.daily_revenue || 0,
          unpaidRevenue: data.unpaid_revenue || 0,
          maintenanceCost: data.maintenance_cost || 0,
          occupancyRate: data.occupancy_rate || 0,
          chartData: data.chart_data || [],
          recentOrders: data.recent_orders || [],
          topCars: data.top_cars || []
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period, false);
    const interval = setInterval(() => {
      fetchDashboardData(period, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [period]);

  const formatChartLabel = (label) => {
    if (!label) return '';
    const rawLabel = String(label).trim();
    if (t.days[rawLabel]) return t.days[rawLabel];
    if (t.months[rawLabel]) return t.months[rawLabel];
    return rawLabel;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/90 dark:bg-gray-800/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl border border-gray-700/50 text-xs space-y-1">
          <p className="font-medium text-gray-400">{formatChartLabel(label)}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 inline-block" />
            <span className="font-bold text-sm text-white">
              {payload[0].value}{' '}
              <span className="text-xs font-normal text-gray-300">{t.reservationsUnit}</span>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    if (!status) return { label: t.unknown, bg: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', dot: 'bg-gray-400' };
    const s = String(status).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (s.includes('valide') || s.includes('validated') || s.includes('payee') || s.includes('terminee') || s.includes('nekena')) {
      return { 
        label: t.validated, 
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50' 
      };
    }
    if (s.includes('partiel')) {
      return { 
        label: t.partial, 
        bg: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
        dot: 'bg-amber-500 shadow-sm shadow-amber-500/50' 
      };
    }
    if (s.includes('attente') || s.includes('pending')) {
      return { 
        label: t.pending, 
        bg: 'bg-yellow-50 text-yellow-700 border-yellow-200/60 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/50',
        dot: 'bg-yellow-500 shadow-sm shadow-yellow-500/50' 
      };
    }
    return { 
      label: t.canceled, 
      bg: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
      dot: 'bg-rose-500 shadow-sm shadow-rose-500/50' 
    };
  };

  const periodTotal = statsData.chartData.reduce((acc, curr) => acc + (curr.locations || 0), 0);

  const stats = [
    { title: t.totalCars, value: statsData.totalCars, icon: Car, color: 'bg-blue-500' },
    { title: t.activeOrders, value: statsData.activeOrders, icon: ShoppingBag, color: 'bg-amber-500' },
    { title: t.revenuePaid, value: `${Number(statsData.dailyRevenue).toLocaleString('fr-FR')} Ar`, icon: TrendingUp, color: 'bg-emerald-500' },
    { title: t.unpaidRevenue, value: `${Number(statsData.unpaidRevenue).toLocaleString('fr-FR')} Ar`, icon: AlertCircle, color: 'bg-orange-500' },
    { title: t.expenses, value: `${Number(statsData.maintenanceCost).toLocaleString('fr-FR')} Ar`, icon: Wrench, color: 'bg-rose-500' },
    { title: t.occupancyRate, value: `${statsData.occupancyRate}%`, icon: Users, color: 'bg-purple-500' },
  ];

  if (loading && statsData.chartData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('data:image/') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://${currentHost}:8000${cleanPath}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t.dashboardTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboardDesc}</p>
      </div>

      {/* CARTES STATISTIQUES GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">{item.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl text-white ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* TOP 3 DES VOITURES AVEC PLAQUE ET PRIX PAR JOUR (STYLES: Or = dorée, Argent = bleu, Bronze = ombre gris) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.topCarsTitle}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.topCarsDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {statsData.topCars && statsData.topCars.length > 0 ? (
            statsData.topCars.slice(0, 3).map((car, index) => {
              // 1er: Or (dorée), 2ème: Argent (bleu), 3ème: Bronze (ombre gris)
              const medals = [
                { 
                  badgeBg: "bg-amber-400 text-amber-950 font-black ring-2 ring-amber-200", 
                  text: "🥇 1er • Or", 
                  border: "border-amber-400/80 dark:border-amber-600 shadow-lg shadow-amber-500/10 bg-amber-50/30 dark:bg-amber-950/20" 
                },
                { 
                  badgeBg: "bg-blue-600 text-white font-bold ring-2 ring-blue-300", 
                  text: "🥈 2ème • Argent", 
                  border: "border-blue-400/80 dark:border-blue-600 shadow-lg shadow-blue-500/10 bg-blue-50/30 dark:bg-blue-950/20" 
                },
                { 
                  badgeBg: "bg-gray-600 text-white font-bold ring-2 ring-gray-300 shadow-md", 
                  text: "🥉 3ème • Bronze", 
                  border: "border-gray-400/80 dark:border-gray-600 shadow-lg shadow-gray-500/10 bg-gray-50/50 dark:bg-gray-900/40" 
                }
              ];
              const currentMedal = medals[index] || medals[2];
              const carImage = getFullImageUrl(car.image);

              const carPlate = car.car_plate || car.plate || car.plaque || car.immatriculation || t.noPlate;
              const carPrice = Number(car.price || car.prix_journalier || car.daily_price || 0).toLocaleString('fr-FR');

              return (
                <div 
                  key={index}
                  className={`group relative rounded-3xl overflow-hidden border ${currentMedal.border} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between`}
                >
                  <div className="relative h-44 w-full overflow-hidden bg-gray-900">
                    {carImage ? (
                      <img 
                        src={carImage} 
                        alt={car.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                        <Car className="w-10 h-10 opacity-30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs shadow-md backdrop-blur-md ${currentMedal.badgeBg}`}>
                      {currentMedal.text}
                    </span>

                    <span className="absolute bottom-3 right-3 text-xs font-mono font-bold text-white bg-black/60 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10">
                      {car.count} {t.reservationsCount}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {car.name}
                      </h3>
                    </div>

                    {/* Plaque et Prix par jour */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700">
                        {carPlate}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {carPrice} {t.perDayLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-400 text-xs font-medium">
              Aucune donnée de voiture disponible pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Section Graphique et Dernières Réservations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.chartTitle}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t.totalPeriod} <span className="font-semibold text-blue-600 dark:text-blue-400">{periodTotal}</span> {t.reservationsUnit}
              </p>
            </div>
            
            <div className="flex bg-gray-100/80 dark:bg-gray-700/50 p-1 rounded-xl text-xs font-medium border border-gray-200/60 dark:border-gray-600/50">
              <button
                type="button"
                onClick={() => setPeriod('day')}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                  period === 'day' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.perDay}
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                  period === 'month' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.perMonth}
              </button>
              <button
                type="button"
                onClick={() => setPeriod('year')}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                  period === 'year' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.perYear}
              </button>
            </div>
          </div>

          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700/40" />
                <XAxis 
                  dataKey={(item) => item.label || item.day || item.month || item.date} 
                  tickFormatter={formatChartLabel}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={8} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.5)', className: 'dark:fill-gray-700/30' }} />
                <Bar dataKey="locations" fill="url(#blueGradient)" radius={[8, 8, 2, 2]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dernières réservations */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
                    {t.recentOrders}
                  </h2>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.last5Activities}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {statsData.recentOrders.length > 0 ? (
                statsData.recentOrders.slice(0, 5).map((order) => {
                  const badge = getStatusBadge(order.status);
                  const clientInitial = order.client ? order.client.charAt(0).toUpperCase() : 'C';

                  return (
                    <div 
                      key={order.id} 
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-700/30 border border-gray-100/80 dark:border-gray-700/40 hover:bg-white dark:hover:bg-gray-700/80 hover:shadow-md hover:border-blue-100 dark:hover:border-gray-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          {clientInitial}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {order.client}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{order.car}</span>
                            <span>•</span>
                            <span className="text-[11px] text-gray-400">{order.date}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium border flex items-center gap-1.5 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-full text-gray-400 mb-2">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{t.noRecentOrders}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-[11px] text-gray-400">
            <span>{t.realtimeUpdate}</span>
            <span className="font-mono text-gray-500">{statsData.recentOrders.length} {t.recordsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}