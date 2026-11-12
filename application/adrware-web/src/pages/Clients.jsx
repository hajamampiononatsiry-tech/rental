import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Star, 
  Award, 
  Phone, 
  Mail, 
  Car, 
  Edit, 
  Trash2, 
  X, 
  Ban,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Loader2,
  User,
  MapPin,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api/clients/`
  : 'http://127.0.0.1:8000/api/clients/';

export default function Clients() {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null); // Référence pour l'input image du formulaire

  // États de l'API
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recherche, Filtrage et Sélection
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_recent'); 
  const [seed, setSeed] = useState(0); 
  const [selectedClientIds, setSelectedClientIds] = useState([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  // Champs formulaire (avec image et imagePreview)
  const initialFormState = { 
    last_name: '',
    first_name: '',
    email: '', 
    phone: '', 
    address: '',
    totalRentals: 0, 
    totalSpent: 0, 
    isBanned: false, 
    banReason: '',
    image: null,
    imagePreview: null
  };
  const [formData, setFormData] = useState(initialFormState);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modales d'actions
  const [banModal, setBanModal] = useState({ isOpen: false, client: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, client: null, isMultiple: false });

  // Charger la liste des clients
  const fetchClients = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setClients(data);
      setError(null);
    } catch (err) {
      console.error("Erreur API Django :", err);
      if (!isBackground) setError("Impossible de se connecter au serveur backend Django.");
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  // Synchronisation automatique en temps réel (toutes les 3 secondes)
  useEffect(() => {
    fetchClients(false);

    const interval = setInterval(() => {
      fetchClients(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getLoyaltyDetails = (rentals, isBanned) => {
    if (isBanned) {
      return { 
        status: t('banned') || 'Banni', 
        discount: 0, 
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 ring-1 ring-rose-500/10', 
        icon: Ban 
      };
    }
    if (rentals >= 5) {
      return { 
        status: t('vip_gold') || 'VIP Gold', 
        discount: 15, 
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 ring-1 ring-amber-500/20', 
        icon: Star 
      };
    } else if (rentals >= 3) {
      return { 
        status: t('vip_bronze') || 'VIP Bronze', 
        discount: 5, 
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ring-1 ring-slate-500/10', 
        icon: Award 
      };
    }
    return { 
      status: t('standard') || 'Standard', 
      discount: 0, 
      badgeBg: 'bg-gray-100/80 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/60', 
      icon: Users 
    };
  };

  // Filtrage et Tri combinés
  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
      const fullName = `${c.last_name || c.name || ''} ${c.first_name || ''}`.toLowerCase();
      const term = searchTerm.toLowerCase();
      return (
        fullName.includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.phone || '').includes(term) ||
        (c.address || '').toLowerCase().includes(term)
      );
    });

    return [...result].sort((a, b) => {
      const nameA = `${a.last_name || a.name || ''} ${a.first_name || ''}`.trim().toLowerCase();
      const nameB = `${b.last_name || b.name || ''} ${b.first_name || ''}`.trim().toLowerCase();

      const dateA = new Date(a.created_at || a.createdAt || a.id).getTime() || a.id || 0;
      const dateB = new Date(b.created_at || b.createdAt || b.id).getTime() || b.id || 0;

      switch (sortBy) {
        case 'az':
          return nameA.localeCompare(nameB);
        case 'za':
          return nameB.localeCompare(nameA);
        case 'date_recent':
          return dateB - dateA;
        case 'date_old':
          return dateA - dateB;
        case 'random':
          return Math.sin(a.id + seed) - Math.sin(b.id + seed);
        default:
          return 0;
      }
    });
  }, [clients, searchTerm, sortBy, seed]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedClientIds([]);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    if (e.target.value === 'random') {
      setSeed(Math.random());
    }
    setCurrentPage(1);
  };

  // Calculs de pagination
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = useMemo(() => {
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, startIndex, itemsPerPage]);

  const isAllPaginatedSelected = useMemo(() => {
    if (paginatedClients.length === 0) return false;
    return paginatedClients.every(client => selectedClientIds.includes(client.id));
  }, [paginatedClients, selectedClientIds]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageIds = paginatedClients.map(c => c.id);
      setSelectedClientIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    } else {
      const currentPageIds = paginatedClients.map(c => c.id);
      setSelectedClientIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedClientIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exportToExcel = () => {
    const headers = ["ID", "Nom", "Prénom", "Email", "Téléphone", "Adresse", "Nombre de locations", "Statut VIP", "Dépenses Totales (Ar)", "Banni", "Motif de bannissement"];
    const clientsToExport = selectedClientIds.length > 0 
      ? filteredClients.filter(c => selectedClientIds.includes(c.id))
      : filteredClients;

    const rows = clientsToExport.map(client => {
      const loyalty = getLoyaltyDetails(client.totalRentals || client.total_rentals, client.isBanned || client.is_banned);
      return [
        client.id,
        `"${(client.last_name || client.name || '').replace(/"/g, '""')}"`,
        `"${(client.first_name || '').replace(/"/g, '""')}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        `"${(client.address || '').replace(/"/g, '""')}"`,
        client.totalRentals || client.total_rentals || 0,
        `"${loyalty.status}"`,
        client.totalSpent || client.total_spent || 0,
        (client.isBanned || client.is_banned) ? "Oui" : "Non",
        `"${(client.banReason || client.ban_reason || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast.error("Le fichier CSV est vide ou invalide.");
          return;
        }

        const headerLine = lines[0];
        const separator = headerLine.includes(';') ? ';' : ',';
        const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i].split(separator).map(val => val.trim().replace(/^["']|["']$/g, ''));
          if (currentLine.length < headers.length) continue;

          const clientData = {};
          headers.forEach((header, index) => {
            clientData[header] = currentLine[index] || '';
          });

          const payload = {
            last_name: clientData['nom'] || clientData['last_name'] || clientData['name'] || 'Client',
            first_name: clientData['prénom'] || clientData['prenom'] || clientData['first_name'] || '',
            email: (clientData['email'] || clientData['e-mail'] || `client_${Date.now()}_${i}@example.com`).toLowerCase(),
            phone: clientData['téléphone'] || clientData['telephone'] || clientData['phone'] || '0340000000',
            address: clientData['adresse'] || clientData['address'] || 'Antananarivo',
            total_rentals: parseInt(clientData['nombre de locations'] || clientData['total_rentals'] || 0, 10) || 0,
            total_spent: parseFloat(clientData['dépenses totales (ar)'] || clientData['total_spent'] || 0) || 0,
            is_banned: (clientData['banni'] || clientData['is_banned'] || '').toLowerCase() === 'oui' || (clientData['banni'] || '').toLowerCase() === 'true',
            ban_reason: clientData['motif de bannissement'] || clientData['ban_reason'] || ''
          };

          try {
            const res = await fetch(API_BASE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) successCount++;
            else errorCount++;
          } catch (err) {
            errorCount++;
          }
        }

        await fetchClients(false);
        toast.success(`Importation terminée ! Succès : ${successCount}, Erreurs : ${errorCount}`);
      } catch (err) {
        console.error("Erreur lecture fichier :", err);
        toast.error("Erreur lors de la lecture du fichier CSV.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ 
        last_name: client.last_name || client.name || '',
        first_name: client.first_name || '',
        email: (client.email || '').toLowerCase(), 
        phone: client.phone || '', 
        address: client.address || '',
        totalRentals: client.totalRentals ?? client.total_rentals ?? 0,
        totalSpent: client.totalSpent ?? client.total_spent ?? 0,
        isBanned: client.isBanned ?? client.is_banned ?? false,
        banReason: client.banReason || client.ban_reason || '',
        image: null,
        imagePreview: client.image || client.profile_picture || null
      });
    } else {
      setEditingClient(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  // Gestion du changement d'image dans le formulaire
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.last_name || formData.last_name.trim().length < 2) {
      toast.error(t('error_name_min') || "Le nom doit comporter au moins 2 caractères.");
      return;
    }

    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length !== 10) {
      toast.error(t('error_phone_digits') || "Le numéro de téléphone doit comporter exactement 10 chiffres.");
      return;
    }

    const url = editingClient ? `${API_BASE_URL}${editingClient.id}/` : API_BASE_URL;
    const method = editingClient ? 'PATCH' : 'POST';

    // Utilisation de FormData pour supporter l'envoi de fichiers (images)
    const dataForm = new FormData();
    dataForm.append('last_name', formData.last_name.trim());
    dataForm.append('first_name', formData.first_name ? formData.first_name.trim() : '');
    dataForm.append('email', formData.email.toLowerCase().trim());
    dataForm.append('phone', formData.phone.trim());
    dataForm.append('address', formData.address.trim());
    dataForm.append('total_rentals', formData.totalRentals);
    dataForm.append('total_spent', formData.totalSpent);
    dataForm.append('is_banned', formData.isBanned);
    dataForm.append('ban_reason', formData.isBanned ? formData.banReason : '');
    
    if (formData.image) {
      dataForm.append('image', formData.image);
    }

    try {
      const response = await fetch(url, {
        method,
        body: dataForm,
      });

      if (response.ok) {
        await fetchClients(false);
        setIsModalOpen(false);
        toast.success(editingClient ? (t('success_update') || "Client modifié avec succès !") : (t('success_add') || "Client ajouté avec succès !"));
      } else {
        const errorData = await response.json();
        toast.error(`Erreur d'enregistrement : ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      console.error("Erreur serveur :", err);
      toast.error("Erreur de connexion au serveur.");
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.isMultiple) {
        await Promise.all(
          selectedClientIds.map(id => 
            fetch(`${API_BASE_URL}${id}/`, { method: 'DELETE' })
          )
        );
        setSelectedClientIds([]);
      } else if (deleteModal.client) {
        await fetch(`${API_BASE_URL}${deleteModal.client.id}/`, { method: 'DELETE' });
        setSelectedClientIds(prev => prev.filter(id => id !== deleteModal.client.id));
      }

      await fetchClients(false);
      setDeleteModal({ isOpen: false, client: null, isMultiple: false });
      toast.success(t('success_delete') || "Suppression effectuée avec succès.");

      if (paginatedClients.length === selectedClientIds.length && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      console.error("Erreur de suppression :", err);
      toast.error("Échec de la suppression.");
    }
  };

  const handleToggleBan = async (e) => {
    e.preventDefault();
    if (!banModal.client) return;

    const currentBanned = banModal.client.isBanned ?? banModal.client.is_banned;
    const nextBannedState = !currentBanned;
    
    const actionEndpoint = nextBannedState ? 'ban/' : 'unban/';
    const payload = nextBannedState 
      ? { is_banned: true, ban_reason: banModal.reason, banReason: banModal.reason } 
      : { is_banned: false, ban_reason: '', banReason: '' };

    try {
      let response = await fetch(`${API_BASE_URL}${banModal.client.id}/${actionEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}${banModal.client.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await fetchClients(false);
        setBanModal({ isOpen: false, client: null, reason: '' });
        toast.success(nextBannedState ? "Client banni avec succès." : "Client débanni avec succès.");
      } else {
        const errorData = await response.json();
        toast.error(`Erreur : ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      console.error("Erreur de bannissement :", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv, .txt" 
        style={{ display: 'none' }} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            {t('clients_loyalty') || 'Clients & Programme de Fidélité'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('clients_subtitle') || "Gérez vos clients, leurs réductions automatiques et leur statut d'accès."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedClientIds.length > 0 && (
            <button 
              onClick={() => setDeleteModal({ isOpen: true, client: null, isMultiple: true })}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              {t('delete') || 'Supprimer'} ({selectedClientIds.length})
            </button>
          )}

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-all whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4" />
            {t('import_excel') || 'Importer Excel'}
          </button>

          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            {selectedClientIds.length > 0 ? `Exporter (${selectedClientIds.length})` : (t('export_excel') || 'Export Excel')}
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            {t('add_client') || 'Nouveau Client'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchClients(false)} className="px-3 py-1 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-800 rounded-lg font-semibold cursor-pointer text-xs">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('client_standard') || 'Client Standard'}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('rentals_1_2') || '1 à 2 Locations'}</p>
            <span className="text-[11px] font-semibold text-blue-500">{t('discount_0') || '0% de remise'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('tier_bronze') || 'Palier VIP Bronze'}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('rentals_3_4') || '3 à 4 Locations'}</p>
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">{t('discount_5') || '-5% de réduction'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Star className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('tier_gold') || 'Palier VIP Gold'}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('rentals_5_plus') || '5+ Locations'}</p>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-emerald-400">{t('discount_15') || '-15% de réduction'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input 
            type="text"
            placeholder={t('search_client_placeholder') || "Rechercher par nom, prénom, email, téléphone ou adresse..."}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="pl-9 pr-4 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer transition-all"
            >
              <option value="date_recent">{t('sort_by') || 'Trier par'}</option>
              <option value="date_recent">{t('sort_date_recent') || 'Date récente'}</option>
              <option value="date_old">{t('sort_date_old') || 'Date ancienne'}</option>
              <option value="az">{t('sort_az') || 'A - Z'}</option>
              <option value="za">{t('sort_za') || 'Z - A'}</option>
              <option value="random">{t('sort_random') || 'Aléatoire'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-semibold">
            <span>{t('show') || 'Afficher'}</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => { 
                setItemsPerPage(Number(e.target.value)); 
                setCurrentPage(1); 
              }}
              className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer transition-all"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>{t('per_page') || 'par page'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-200/80 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="p-4">{t('client') || 'Client'}</th>
                <th className="p-4">{t('contact') || 'Contact & Adresse'}</th>
                <th className="p-4">{t('rentals_count') || 'Locations effectuées'}</th>
                <th className="p-4">{t('loyalty_status') || 'Statut / Remise'}</th>
                <th className="p-4">{t('total_spent') || 'Dépenses Totales'}</th>
                <th className="p-4 text-center">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-medium">Chargement des clients...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedClients.length > 0 ? (
                paginatedClients.map((client) => {
                  const rentalsCount = client.totalRentals ?? client.total_rentals ?? 0;
                  const spentAmount = client.totalSpent ?? client.total_spent ?? 0;
                  const isBanned = client.isBanned ?? client.is_banned ?? false;
                  const banReason = client.banReason || client.ban_reason || '';
                  const clientImage = client.image || client.profile_picture || null;

                  const loyalty = getLoyaltyDetails(rentalsCount, isBanned);
                  const BadgeIcon = loyalty.icon;
                  const isSelected = selectedClientIds.includes(client.id);

                  const displayName = client.last_name 
                    ? `${client.last_name} ${client.first_name || ''}`.trim()
                    : client.name || '';

                  return (
                    <tr 
                      key={client.id} 
                      className={`hover:bg-blue-50/40 dark:hover:bg-gray-700/40 transition-colors ${
                        isSelected 
                          ? 'bg-blue-50/60 dark:bg-blue-950/40' 
                          : isBanned 
                            ? 'bg-rose-50/30 dark:bg-rose-950/20' 
                            : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(client.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                        <div className="flex items-center gap-3">
                          {clientImage ? (
                            <img 
                              src={clientImage.startsWith('http') ? clientImage : `http://127.0.0.1:8000${clientImage}`} 
                              alt={displayName} 
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 font-bold">
                              <span>{displayName}</span>
                              {isBanned && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-md border border-rose-200 inline-flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> {t('banned_tag') || 'BANNI'}
                                </span>
                              )}
                            </div>
                            {isBanned && (
                              <p className="text-xs text-rose-500 mt-0.5 italic">{t('reason') || 'Motif'} : {banReason}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{client.phone || client.phone_number}</span>
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{client.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-800 dark:text-gray-200">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-xs">
                          <Car className="w-3.5 h-3.5 text-blue-500" />
                          {rentalsCount} {t('rentals') || 'réservation(s)'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${loyalty.badgeBg}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {loyalty.status} {loyalty.discount > 0 && `(-${loyalty.discount}%)`}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(spentAmount).toLocaleString('fr-FR')} Ar
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <button 
                            onClick={() => setBanModal({ isOpen: true, client, reason: banReason })}
                            className={`p-2.5 rounded-xl border transition-all shadow-xs flex items-center justify-center cursor-pointer ${
                              isBanned 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white border-emerald-200 dark:border-emerald-800' 
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white dark:bg-amber-950/50 dark:text-amber-400 dark:hover:bg-amber-600 dark:hover:text-white border-amber-200 dark:border-amber-800'
                            }`}
                            title={isBanned ? (t('unban') || "Débannir") : (t('ban') || "Bannir")}
                          >
                            {isBanned ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          <button 
                            onClick={() => handleOpenModal(client)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            title={t('edit') || "Modifier"}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, client, isMultiple: false })}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            title={t('delete') || "Supprimer"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400">
                    {t('no_clients_found') || 'Aucun client trouvé'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredClients.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold text-center sm:text-left">
              {t('showing') || 'Affichage de'} <span className="font-bold text-gray-700 dark:text-gray-200">{startIndex + 1}</span> {t('to') || 'à'} <span className="font-bold text-gray-700 dark:text-gray-200">{Math.min(startIndex + itemsPerPage, filteredClients.length)}</span> {t('of') || 'sur'} <span className="font-bold text-gray-700 dark:text-gray-200">{filteredClients.length}</span> {t('entries') || 'clients'}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, array) => {
                    const showEllipsis = idx > 0 && page - array[idx - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALE AJOUT / MODIFICATION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl my-8 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-600 text-white flex justify-between items-center shrink-0 shadow-sm">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {editingClient ? (t('edit_client') || 'Modifier le Client') : (t('add_client') || 'Ajouter un Nouveau Client')}
                </h2>
                <p className="text-xs text-blue-100 font-normal">
                  {t('create_client_sub') || "Creation client sub"}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-sm">
              
              {/* CHAMP IMAGE / AVATAR DU CLIENT */}
              <div className="flex flex-col items-center justify-center pb-2 border-b border-gray-100 dark:border-gray-700/80">
                <input 
                  type="file" 
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="relative group cursor-pointer" onClick={() => imageInputRef.current?.click()}>
                  {formData.imagePreview ? (
                    <img 
                      src={formData.imagePreview.startsWith('http') || formData.imagePreview.blob ? formData.imagePreview : `http://127.0.0.1:8000${formData.imagePreview}`} 
                      alt="Aperçu" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/50 border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Modifier
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Cliquez pour ajouter ou changer la photo du client</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('last_name_label') || 'Nom'} 
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" required minLength={2} value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Ex: RAKOTO"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('first_name_label') || 'Prénom(s)'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Ex: Jean Marc"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('email_address') || 'Adresse E-mail'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    placeholder="client@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('phone') || 'Téléphone'} 
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" required maxLength={10} value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Ex: 0340000000"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-blue-500 transition-all font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('address_label') || 'Adresse'} 
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" required value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Lot IVG 123 Antananarivo"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isBanned}
                    onChange={(e) => setFormData({ ...formData, isBanned: e.target.checked })}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  {t('ban_client_checkbox') || 'Bannir ce client'}
                </label>

                {formData.isBanned && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('ban_reason_label') || 'Motif de bannissement'} 
                    </label>
                    <input 
                      type="text"
                      required={formData.isBanned}
                      value={formData.banReason}
                      onChange={(e) => setFormData({ ...formData, banReason: e.target.value })}
                      placeholder="Ex: Non-respect du contrat, dommage sur véhicule..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-rose-200 dark:border-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-sm font-semibold transition-all cursor-pointer"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  {t('save') || 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t('confirm_delete_title') || 'Confirmer la suppression'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {deleteModal.isMultiple ? (
                <>Êtes-vous sûr de vouloir supprimer les <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedClientIds.length}</span> clients sélectionnés ?</>
              ) : (
                <>{t('confirm_delete_msg') || 'Êtes-vous sûr de vouloir supprimer le client'} <span className="font-semibold text-gray-800 dark:text-gray-200">{deleteModal.client?.last_name ? `${deleteModal.client.last_name} ${deleteModal.client.first_name || ''}` : deleteModal.client?.name}</span> ?</>
              )} {t('action_undone') || 'Cette action est définitive et ne pourra pas être annulée.'}
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/80">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, client: null, isMultiple: false })}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {t('delete_confirm') || 'Oui, Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {banModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${(banModal.client?.isBanned ?? banModal.client?.is_banned) ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {(banModal.client?.isBanned ?? banModal.client?.is_banned) ? <CheckCircle2 className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {(banModal.client?.isBanned ?? banModal.client?.is_banned) ? (t('unban') || 'Débannir le client') : (t('ban') || 'Bannir le client')}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(banModal.client?.isBanned ?? banModal.client?.is_banned) 
                ? `${t('unban_confirm_msg') || 'Voulez-vous réautoriser'} ${banModal.client?.last_name || banModal.client?.name || ''} ${t('to_make_rentals') || 'à effectuer des réservations ?'}`
                : `${t('ban_confirm_msg') || 'Le client'} ${banModal.client?.last_name || banModal.client?.name || ''} ${t('will_be_banned') || 'sera marqué comme banni.'}`}
            </p>
            
            <form onSubmit={handleToggleBan} className="space-y-4">
              {!(banModal.client?.isBanned ?? banModal.client?.is_banned) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('ban_reason_label') || 'Motif du bannissement'} *
                  </label>
                  <textarea 
                    required
                    rows="3"
                    value={banModal.reason}
                    onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                    placeholder="Ex: Non-respect du contrat, dommage sur véhicule..."
                    className="w-full p-3 text-xs rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/80">
                <button 
                  type="button" 
                  onClick={() => setBanModal({ isOpen: false, client: null, reason: '' })}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button 
                  type="submit"
                  className={`px-4 py-2.5 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
                    (banModal.client?.isBanned ?? banModal.client?.is_banned) 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {t('confirm') || 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}