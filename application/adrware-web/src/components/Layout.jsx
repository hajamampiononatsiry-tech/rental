import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  ShoppingBag, 
  FileText, 
  Users, 
  Sun, 
  Moon, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Wrench,
  User,
  Info,
  Bell,
  CheckCircle,
  Clock,
  Mail,
  AlertTriangle,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.png'; 
import api from '../services/api'; // Instance Axios configurée

export default function Layout({ children }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Gestion du menu déroulant et des notifications dynamiques
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Fonction pour récupérer et filtrer les notifications depuis l'API Django
  const fetchNotifications = async () => {
    try {
      const response = await api.get('notifications/');
      if (response.data) {
        // FILTRAGE STRICT : On ne garde que Panne, Proposition, Inscription, Réservation, Paiement
        const allowedTypes = ['panne', 'proposition', 'inscription', 'reservation', 'paiement'];
        
        const filteredData = response.data.filter(n => {
          const typeLower = (n.type || '').toLowerCase();
          const titleLower = (n.title || '').toLowerCase();
          const messageLower = (n.message || '').toLowerCase();
          
          // Vérifie si le type ou le contenu correspond aux critères demandés
          const matchesType = allowedTypes.some(t => typeLower.includes(t));
          const matchesKeywords = allowedTypes.some(kw => titleLower.includes(kw) || messageLower.includes(kw));
          
          return matchesType || matchesKeywords;
        });

        // Formatage et prise en compte du statut lu/non lu partagé par le backend
        const formatted = filteredData.map(n => ({
          ...n,
          unread: !n.is_read // Utilise directement le champ serveur pour que ce soit synchro pour toute l'équipe
        }));

        // Inverser l'ordre pour afficher les plus récents en haut
        setNotifications(formatted.reverse());
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications :", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Actualisation automatique toutes les 3 secondes pour le temps réel en commun
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le menu des notifications lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compter les notifications non lues
  const unreadCount = notifications.filter(n => n.unread).length;

  // Marquer tout comme lu (Mise à jour visuelle immédiate + synchro serveur)
  const markAllAsRead = async () => {
    // 1. Mise à jour instantanée de l'interface pour tous
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

    // 2. Appel au serveur Django en arrière-plan
    try {
      await api.post('notifications/mark-all-read/');
    } catch (error) {
      console.error("Erreur lors du marquage global des notifications :", error);
    }
  };

  // Marquer une notification spécifique comme lue (Mise à jour visuelle immédiate + synchro serveur)
  const markAsRead = async (id) => {
    // 1. Mise à jour instantanée de l'interface pour éviter le retour en arrière par le timer de 3s
    setNotifications(prev =>
      prev.map(n => String(n.id) === String(id) ? { ...n, unread: false } : n)
    );

    // 2. Appel au serveur Django pour enregistrer l'état pour toute l'équipe
    try {
      await api.post(`notifications/${id}/mark-read/`);
    } catch (error) {
      console.error("Erreur lors du marquage de la notification :", error);
    }
  };

  const handleViewAllReservations = () => {
    markAllAsRead();
    setIsNotificationsOpen(false);
  };

  // Styles et icônes adaptés selon le type filtré (Panne, Proposition, Inscription, Réservation, Paiement)
  const getNotificationStyle = (type, unread) => {
    const typeLower = (type || '').toLowerCase();
    
    if (typeLower.includes('panne') || typeLower.includes('maintenance')) {
      return {
        icon: <Wrench className="w-4 h-4 text-red-600 dark:text-red-400" />,
        badgeBg: 'bg-red-100 dark:bg-red-900/40',
        containerClass: unread 
          ? 'bg-red-50/90 dark:bg-red-950/40 border-l-4 border-red-600 font-semibold' 
          : 'bg-white dark:bg-gray-800 opacity-60 border-l-4 border-transparent hover:opacity-100'
      };
    }
    if (typeLower.includes('proposition')) {
      return {
        icon: <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
        containerClass: unread 
          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-l-4 border-amber-600 font-semibold' 
          : 'bg-white dark:bg-gray-800 opacity-60 border-l-4 border-transparent hover:opacity-100'
      };
    }
    if (typeLower.includes('paiement')) {
      return {
        icon: <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        containerClass: unread 
          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-emerald-600 font-semibold' 
          : 'bg-white dark:bg-gray-800 opacity-60 border-l-4 border-transparent hover:opacity-100'
      };
    }
    if (typeLower.includes('inscription') || typeLower.includes('client')) {
      return {
        icon: <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
        containerClass: unread 
          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-l-4 border-purple-600 font-semibold' 
          : 'bg-white dark:bg-gray-800 opacity-60 border-l-4 border-transparent hover:opacity-100'
      };
    }
    // Par défaut : Réservation
    return {
      icon: <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
      containerClass: unread 
        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-l-4 border-blue-600 font-semibold' 
        : 'bg-white dark:bg-gray-800 opacity-60 border-l-4 border-transparent hover:opacity-100'
    };
  };

  // État local pour l'utilisateur connecté
  const [currentUser, setCurrentUser] = useState({
    name: 'Chargement...',
    email: '',
    initials: 'AD',
    photoUrl: null
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('accounts/me/');
      const data = response.data;
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'Administrateur';
      const initials = (data.first_name?.charAt(0) || 'A') + (data.last_name?.charAt(0) || 'D');

      setCurrentUser({
        name: fullName,
        email: data.email || '',
        initials: initials.toUpperCase(),
        photoUrl: data.profile_picture || null
      });
    } catch (error) {
      console.error('Erreur de chargement du profil admin :', error);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.email) {
        setCurrentUser({
          name: `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim() || 'Administrateur',
          email: storedUser.email,
          initials: 'AD',
          photoUrl: storedUser.profile_picture || null
        });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  const menuItems = [
    { name: t('accueil'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('catalogue'), path: '/catalogue', icon: Car },
    { name: t('reservation'), path: '/commandes', icon: ShoppingBag },
    { name: t('clients') || 'Clients', path: '/clients', icon: Users },
    { name: t('facturation'), path: '/factures', icon: FileText },
    { name: t('maintenance'), path: '/maintenance', icon: Wrench },
    { name: t('profile') || 'Mon Profil', path: '/userprofile', icon: User },
    { name: t('aboutUs') || 'À propos', path: '/aboutus', icon: Info },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200 print:bg-white print:h-auto print:overflow-visible">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between transition-all duration-300 ease-in-out relative h-full print:hidden`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-blue-600 text-white p-1 rounded-full shadow-md hover:bg-blue-700 transition-colors z-10"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-shrink-0 flex flex-col items-center py-4 px-2 border-b border-gray-200 dark:border-gray-700">
          <img 
            src={logo} 
            alt="Logo ADRWARE" 
            className={`${
              isSidebarOpen ? 'w-14 h-14' : 'w-10 h-10'
            } rounded-full object-cover shadow-md border-2 border-blue-500 transition-all duration-300`} 
          />
          {isSidebarOpen && (
            <div className="text-center mt-2 transition-opacity duration-300">
              <h1 className="text-base font-bold text-blue-600 dark:text-blue-400 tracking-wide">ADRWARE</h1>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t('adminTitle')}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center ${
                  isSidebarOpen ? 'px-3.5 justify-start' : 'justify-center px-2'
                } py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mr-0'}`} />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Profil utilisateur bas de sidebar */}
        <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
          {isSidebarOpen ? (
            <div className="flex flex-col gap-3">
              <Link 
                to="/userprofile" 
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors group"
              >
                {currentUser.photoUrl ? (
                  <img 
                    src={currentUser.photoUrl} 
                    alt={currentUser.name} 
                    className="w-10 h-10 rounded-full object-cover border border-blue-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/20">
                    {currentUser.initials}
                  </div>
                )}

                <div className="overflow-hidden">
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </Link>

              <Link 
                to="/login" 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-200/50 dark:border-red-900/30"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout') || 'Déconnexion'}</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1">
              <Link to="/userprofile" title={currentUser.name}>
                {currentUser.photoUrl ? (
                  <img 
                    src={currentUser.photoUrl} 
                    alt={currentUser.name} 
                    className="w-9 h-9 rounded-full object-cover border border-blue-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                    {currentUser.initials}
                  </div>
                )}
              </Link>
              <Link 
                to="/login" 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title={t('logout')}
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:w-full print:h-auto">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 print:hidden">
          <h2 className="text-lg font-semibold capitalize">
            {t(location.pathname.replace('/', '') || 'accueil')}
          </h2>

          <div className="flex items-center gap-4">
            {/* Langue */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
              <Globe className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="fr" className="dark:bg-gray-800">FR 🇫🇷</option>
                <option value="en" className="dark:bg-gray-800">EN 🇬🇧</option>
                <option value="mg" className="dark:bg-gray-800">MG 🇲🇬</option>
              </select>
            </div>

            {/* Mode Sombre / Clair */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={t('theme')}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* CLOCHE DE NOTIFICATION FILTRÉE & SYNCHRONISÉE */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                title={language === 'mg' ? 'Fampandrenesana' : language === 'en' ? 'Notifications' : 'Notifications'}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Menu déroulant des notifications */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {language === 'mg' ? 'Fampandrenesana mivantana' : language === 'en' ? 'Live Notifications' : 'Notifications en direct'}
                    </span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckCircle className="w-3 h-3" /> 
                        {language === 'mg' ? 'Mariho ho voavaky daholo' : language === 'en' ? 'Mark all as read' : 'Tout marquer lu'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const styleInfo = getNotificationStyle(n.type, n.unread);
                        return (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={`p-3 cursor-pointer transition-all relative ${styleInfo.containerClass}`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Point indicateur bleu clignotant pour le non-lu */}
                              {n.unread && (
                                <span className="absolute right-3 top-3 w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                              )}

                              {/* Logo / Icône avec fond coloré */}
                              <div className={`p-1.5 rounded-lg ${styleInfo.badgeBg} shrink-0 mt-0.5`}>
                                {styleInfo.icon}
                              </div>

                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-start justify-between">
                                  <p className={`text-xs truncate ${n.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400'}`}>
                                    {n.title}
                                  </p>
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0 ml-2">
                                    <Clock className="w-2.5 h-2.5" /> {n.time}
                                  </span>
                                </div>
                                <p className={`text-xs mt-1 leading-relaxed ${n.unread ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                        {language === 'mg' ? 'Tsy misy fampandrenesana vaovao' : language === 'en' ? 'No new notifications' : 'Aucune nouvelle notification'}
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-800/50">
                    <Link 
                      to="/commandes" 
                      onClick={handleViewAllReservations}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline block py-1"
                    >
                      {language === 'mg' ? 'Jereo daholo ny famandrihana' : language === 'en' ? 'View all orders' : 'Voir toutes les commandes'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible print:bg-white">
          {children}
        </main>
      </div>

    </div>
  );
}