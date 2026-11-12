import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  X, 
  Check,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Car,
  DollarSign,
  FileText,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MaintenancePage() {
  const { language } = useLanguage();

  const t = {
    fr: {
      title: "Maintenance des Véhicules",
      subtitle: "Suivi des révisions, réparations et entretiens de la flotte.",
      deleteSelected: "Supprimer",
      scheduleBtn: "Programmer entretien",
      searchPlaceholder: "Rechercher par véhicule ou service...",
      allStatuses: "Tous les statuts",
      sortBy: "Trier par",
      sort_date_recent: "Date récente",
      sort_date_old: "Date ancienne",
      sort_az: "A - Z",
      sort_za: "Z - A",
      sort_random: "Aléatoire",
      show: "Afficher",
      perPage: "par page",
      tableCar: "Véhicule",
      tableService: "Type de service",
      tablePeriod: "Période / Date",
      tableCost: "Coût",
      tableStatus: "Statut",
      tableActions: "Actions",
      noRecords: "Aucun enregistrement de maintenance trouvé.",
      showing: "Affichage de",
      to: "à",
      of: "sur",
      entries: "entretiens",
      confirmDeleteTitle: "Confirmer la suppression",
      confirmDeleteText: "Voulez-vous vraiment supprimer",
      confirmDeleteCount: "enregistrement(s) ?",
      confirmDeleteWarning: "Cette action est irréversible.",
      cancel: "Annuler",
      confirmDeleteBtn: "Oui, Supprimer",
      modalCreateTitle: "Programmer un Entretien",
      modalCreateSub: "Définissez un plan d'intervention mécanique",
      modalEditTitle: "Modifier l'entretien",
      modalEditSub: "Mettre à jour la fiche d'entretien",
      selectCar: "Sélectionner la voiture",
      chooseCar: "-- Choisir un véhicule --",
      noImmat: "Sans immat.",
      serviceType: "Type de service",
      status: "Statut",
      startDate: "Date début",
      endDate: "Date fin (Estimée)",
      cost: "Coût estimé / réel (Ar)",
      description: "Description / Remarques",
      descPlaceholder: "Détails des travaux à faire...",
      saveChanges: "Enregistrer les modifications",
      saveCreate: "Enregistrer l'entretien",
      statusPlanned: "Planifiée",
      statusInProg: "En cours",
      statusCompleted: "Terminée",
      servOil: "Vidange",
      servRepair: "Réparation",
      servTech: "Contrôle technique",
      servTires: "Pneumatique",
      servOther: "Autre",
      dateErrorStart: "La date de début ne peut pas être antérieure à aujourd'hui.",
      dateErrorEnd: "La date de fin doit être égale ou postérieure à la date de début.",
      quickCompleteTooltip: "Marquer comme terminée (Réparée)",
      editTooltip: "Modifier",
      deleteTooltip: "Supprimer",
      toWord: "au"
    },
    en: {
      title: "Vehicle Maintenance",
      subtitle: "Track fleet revisions, repairs, and maintenance.",
      deleteSelected: "Delete",
      scheduleBtn: "Schedule Maintenance",
      searchPlaceholder: "Search by vehicle or service...",
      allStatuses: "All Statuses",
      sortBy: "Sort by",
      sort_date_recent: "Newest Date",
      sort_date_old: "Oldest Date",
      sort_az: "A - Z",
      sort_za: "Z - A",
      sort_random: "Random",
      show: "Show",
      perPage: "per page",
      tableCar: "Vehicle",
      tableService: "Service Type",
      tablePeriod: "Period / Date",
      tableCost: "Cost",
      tableStatus: "Status",
      tableActions: "Actions",
      noRecords: "No maintenance records found.",
      showing: "Showing",
      to: "to",
      of: "of",
      entries: "entries",
      confirmDeleteTitle: "Confirm Deletion",
      confirmDeleteText: "Are you sure you want to delete",
      confirmDeleteCount: "record(s)?",
      confirmDeleteWarning: "This action cannot be undone.",
      cancel: "Cancel",
      confirmDeleteBtn: "Yes, Delete",
      modalCreateTitle: "Schedule Maintenance",
      modalCreateSub: "Set up a mechanical service plan",
      modalEditTitle: "Edit Maintenance",
      modalEditSub: "Update maintenance details",
      selectCar: "Select Vehicle",
      chooseCar: "-- Choose a vehicle --",
      noImmat: "No plate",
      serviceType: "Service Type",
      status: "Status",
      startDate: "Start Date",
      endDate: "End Date (Estimated)",
      cost: "Estimated / Actual Cost (Ar)",
      description: "Description / Notes",
      descPlaceholder: "Details of work to be done...",
      saveChanges: "Save Changes",
      saveCreate: "Save Maintenance",
      statusPlanned: "Planned",
      statusInProg: "In Progress",
      statusCompleted: "Completed",
      servOil: "Oil Change",
      servRepair: "Repair",
      servTech: "Technical Inspection",
      servTires: "Tire Service",
      servOther: "Other",
      dateErrorStart: "Start date cannot be earlier than today.",
      dateErrorEnd: "End date must be on or after the start date.",
      quickCompleteTooltip: "Mark as completed (Repaired)",
      editTooltip: "Edit",
      deleteTooltip: "Delete",
      toWord: "to"
    },
    mg: {
      title: "Fikarakarana Fiara",
      subtitle: "Fanaraha-maso ny fanavaozana sy fikarakarana ny fiara rehetra.",
      deleteSelected: "Fafao",
      scheduleBtn: "Handamina fikarakarana",
      searchPlaceholder: "Karohy araka ny fiara na tolotra...",
      allStatuses: "Ny toe-javatra rehetra",
      sortBy: "Sivana araka",
      sort_date_recent: "Daty vaovao indrindra",
      sort_date_old: "Daty taloha indrindra",
      sort_az: "A - Z",
      sort_za: "Z - A",
      sort_random: "Kisendrasendra",
      show: "Asehoy",
      perPage: "isaky ny pejy",
      tableCar: "Fiara",
      tableService: "Karazana tolotra",
      tablePeriod: "Fe-potoana / Daty",
      tableCost: "Vola lany",
      tableStatus: "Toe-javatra",
      tableActions: "Asa",
      noRecords: "Tsy misy rakitsoratra momba ny fikarakarana hita.",
      showing: "Mampiseho ny",
      to: "hatramin'ny",
      of: "amin'ny",
      entries: "rakitsoratra",
      confirmDeleteTitle: "Hamafiso ny famafana",
      confirmDeleteText: "Tena tianao ve ny hamafa ny",
      confirmDeleteCount: "rakitsoratra?",
      confirmDeleteWarning: "Tsy azo averina intsony ity asa ity.",
      cancel: "Aoka ihany",
      confirmDeleteBtn: "Eny, Fafao",
      modalCreateTitle: "Handamina Fikarakarana",
      modalCreateSub: "Mametraka drafitra fanamboarana mekanika",
      modalEditTitle: "Ovay ny Fikarakarana",
      modalEditSub: "Manavao ny antsipirian'ny fikarakarana",
      selectCar: "Safidio ny fiara",
      chooseCar: "-- Misafidiana fiara --",
      noImmat: "Tsy misy laharana",
      serviceType: "Karazana tolotra",
      status: "Toe-javatra",
      startDate: "Daty nanombohana",
      endDate: "Daty nifarana (Tombanana)",
      cost: "Vola lany tombanana / tena izy (Ar)",
      description: "Famaritana / Fanamarihana",
      descPlaceholder: "Antsipirian'ny asa hatao...",
      saveChanges: "Tehirizo ny fanovana",
      saveCreate: "Tehirizo ny fikarakarana",
      statusPlanned: "Voalahatra",
      statusInProg: "Mandeha",
      statusCompleted: "Vita",
      servOil: "Fanovana solika (Vidange)",
      servRepair: "Fanamboarana",
      servTech: "Fisafoana ara-teknika",
      servTires: "Kodiarana",
      servOther: "Hafa",
      dateErrorStart: "Tsy azo atao alohan'ny androany ny daty nanombohana.",
      dateErrorEnd: "Ny daty nifarana dia tsy maintsy mitovy na aorian'ny daty nanombohana.",
      quickCompleteTooltip: "Mariho ho vita (Voamboatra)",
      editTooltip: "Ovay",
      deleteTooltip: "Fafao",
      toWord: "hatramin'ny"
    }
  };

  const texts = t[language] || t.fr;

  const [maintenances, setMaintenances] = useState([]);
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TOUS');
  const [selectedSortFilter, setSelectedSortFilter] = useState('date_recent');
  const [seed, setSeed] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, items: [] });
  
  const today = new Date().toISOString().split('T')[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    car: '',
    type_service: 'Vidange',
    description: '',
    cout: '',
    date_debut: '',
    date_fin: '',
    statut: 'Planifiée',
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const API_BASE_URL = `http://${currentHost}:8000/api`;

  useEffect(() => {
    fetchMaintenances();
    fetchCars();
  }, []);

  // AUTOMATISATION DU STATUT (Planifiée -> En cours -> Terminée)
  const fetchMaintenances = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/maintenances/`);
      const data = await res.json();

      const updatedData = await Promise.all(data.map(async (m) => {
        let newStatus = m.statut;

        // 1. Si la date de fin est dépassée -> Terminée
        if (m.statut !== 'Terminée' && m.date_fin && m.date_fin < today) {
          newStatus = 'Terminée';
        }
        // 2. Si aujourd'hui >= date_debut (et pas encore terminée) -> En cours
        else if (m.statut === 'Planifiée' && m.date_debut <= today && (!m.date_fin || m.date_fin >= today)) {
          newStatus = 'En cours';
        }

        // Si le statut change automatiquement
        if (newStatus !== m.statut) {
          await fetch(`${API_BASE_URL}/maintenances/${m.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: newStatus }),
          });

          if (m.car) {
            const carNewStatus = newStatus === 'Terminée' ? 'Disponible' : 'En maintenance';
            await fetch(`${API_BASE_URL}/cars/${m.car}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: carNewStatus }),
            });
          }
          return { ...m, statut: newStatus };
        }

        return m;
      }));

      setMaintenances(updatedData);
    } catch (err) {
      console.error("Erreur de chargement maintenances :", err);
    }
  };

  const fetchCars = () => {
    fetch(`${API_BASE_URL}/cars/`)
      .then((res) => res.json())
      .then((data) => setCars(data))
      .catch((err) => console.error("Erreur de chargement véhicules :", err));
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      car: cars.length > 0 ? cars[0].id : '',
      type_service: 'Vidange',
      description: '',
      cout: '',
      date_debut: today,
      date_fin: '',
      statut: 'Planifiée',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingId(m.id);
    setFormData({
      car: m.car || '',
      type_service: m.type_service || 'Vidange',
      description: m.description || '',
      cout: m.cout || '',
      date_debut: m.date_debut || '',
      date_fin: m.date_fin || '',
      statut: m.statut || 'Planifiée',
    });
    setIsModalOpen(true);
  };

  const handleQuickComplete = async (m) => {
    try {
      await fetch(`${API_BASE_URL}/maintenances/${m.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          statut: 'Terminée',
          date_fin: m.date_fin || today 
        }),
      });

      if (m.car) {
        await fetch(`${API_BASE_URL}/cars/${m.car}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Disponible' }),
        });
      }

      fetchMaintenances();
      fetchCars();
    } catch (err) {
      console.error("Erreur lors de la clôture de l'entretien :", err);
    }
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(
        deleteModal.items.map(async (item) => {
          const res = await fetch(`${API_BASE_URL}/maintenances/${item.id}/`, {
            method: 'DELETE',
          });
          if (res.ok && item.car) {
            await fetch(`${API_BASE_URL}/cars/${item.car}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Disponible' }),
            });
          }
        })
      );

      const deletedIds = deleteModal.items.map(i => i.id);
      setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
      fetchMaintenances();
      fetchCars();
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
    } finally {
      setDeleteModal({ isOpen: false, items: [] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Empêcher la date passée SEULEMENT lors de la création
    if (!editingId && formData.date_debut < today) {
      alert(texts.dateErrorStart);
      return;
    }

    if (formData.date_fin && formData.date_fin < formData.date_debut) {
      alert(texts.dateErrorEnd);
      return;
    }

    const url = editingId 
      ? `${API_BASE_URL}/maintenances/${editingId}/` 
      : `${API_BASE_URL}/maintenances/`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        let newCarStatus = null;
        if (
          formData.statut === 'En cours' || 
          (formData.date_debut <= today && (!formData.date_fin || formData.date_fin >= today) && formData.statut !== 'Terminée')
        ) {
          newCarStatus = 'En maintenance';
        } else if (formData.statut === 'Terminée') {
          newCarStatus = 'Disponible';
        }

        if (newCarStatus && formData.car) {
          await fetch(`${API_BASE_URL}/cars/${formData.car}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newCarStatus }),
          });
        }

        fetchMaintenances();
        fetchCars();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
    }
  };

  const formatServiceType = (service) => {
    if (!service) return texts.servOther;
    const s = String(service)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (s.includes('vidange') || s.includes('oil')) return texts.servOil;
    if (s.includes('reparation') || s.includes('repair')) return texts.servRepair;
    if (s.includes('controle') || s.includes('technique') || s.includes('tech')) return texts.servTech;
    if (s.includes('pneu') || s.includes('tire')) return texts.servTires;
    return texts.servOther;
  };

  const formatMaintenanceStatus = (statut) => {
    if (!statut) return texts.statusPlanned;
    const s = String(statut)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (s.includes('termine') || s.includes('completed') || s.includes('vita')) {
      return texts.statusCompleted;
    }
    if (s.includes('cours') || s.includes('prog') || s.includes('mandeha')) {
      return texts.statusInProg;
    }
    if (s.includes('planif') || s.includes('planned') || s.includes('voalahatra')) {
      return texts.statusPlanned;
    }
    return statut;
  };

  const getStatusBadge = (statut) => {
    const translatedStatus = formatMaintenanceStatus(statut);
    const s = String(statut)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (s.includes('termine') || s.includes('completed') || s.includes('vita')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" /> {translatedStatus}
        </span>
      );
    }
    if (s.includes('cours') || s.includes('prog') || s.includes('mandeha')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5" /> {translatedStatus}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <Calendar className="w-3.5 h-3.5" /> {translatedStatus}
      </span>
    );
  };

  const filteredMaintenances = useMemo(() => {
    let result = maintenances.filter((item) => {
      const matchesSearch =
        item.car_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type_service?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'TOUS' || item.statut === filterStatus;
      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      const nameA = a.car_name?.toLowerCase() || '';
      const nameB = b.car_name?.toLowerCase() || '';
      const dateA = new Date(a.date_debut || 0).getTime();
      const dateB = new Date(b.date_debut || 0).getTime();

      switch (selectedSortFilter) {
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
  }, [maintenances, searchTerm, filterStatus, selectedSortFilter, seed]);

  const totalPages = Math.ceil(filteredMaintenances.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMaintenances = filteredMaintenances.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = currentMaintenances.map((m) => m.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = currentMaintenances.map((m) => m.id);
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 font-sans max-w-[1600px] mx-auto p-2 sm:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" /> {texts.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {texts.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                const itemsToDelete = maintenances.filter((m) => selectedIds.includes(m.id));
                setDeleteModal({ isOpen: true, items: itemsToDelete });
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm animate-fade-in"
            >
              <Trash2 className="w-4 h-4" /> {texts.deleteSelected} ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> {texts.scheduleBtn}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={texts.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="TOUS">{texts.allStatuses}</option>
              <option value="Planifiée">{texts.statusPlanned}</option>
              <option value="En cours">{texts.statusInProg}</option>
              <option value="Terminée">{texts.statusCompleted}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSortFilter}
              onChange={(e) => {
                setSelectedSortFilter(e.target.value);
                if (e.target.value === 'random') {
                  setSeed(Math.random());
                }
                setCurrentPage(1);
              }}
              className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="date_recent">{texts.sortBy}</option>
              <option value="date_recent">{texts.sort_date_recent}</option>
              <option value="date_old">{texts.sort_date_old}</option>
              <option value="az">{texts.sort_az}</option>
              <option value="za">{texts.sort_za}</option>
              <option value="random">{texts.sort_random}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold">
            <span>{texts.show}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>{texts.perPage}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-200/80 dark:border-gray-700/80 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      currentMaintenances.length > 0 &&
                      currentMaintenances.every((m) => selectedIds.includes(m.id))
                    }
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="p-4">{texts.tableCar}</th>
                <th className="p-4">{texts.tableService}</th>
                <th className="p-4">{texts.tablePeriod}</th>
                <th className="p-4">{texts.tableCost}</th>
                <th className="p-4">{texts.tableStatus}</th>
                <th className="p-4 text-center">{texts.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
              {currentMaintenances.length > 0 ? (
                currentMaintenances.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const plateText = m.car_immatriculation || m.car_plate || m.plate || m.plaque || m.registration || '';
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-gray-100/70 dark:hover:bg-gray-700/60 transition-all duration-150 ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(m.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="p-4 font-bold text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-blue-500" />
                          <span>{m.car_name}</span>
                        </div>
                        {plateText && (
                          <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400 ml-6 mt-0.5">
                            {plateText}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-300 font-semibold">
                        {formatServiceType(m.type_service)}
                      </td>
                      <td className="p-4 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{m.date_debut} {m.date_fin ? `${texts.toWord} ${m.date_fin}` : ''}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                        {Number(m.cout || 0).toLocaleString('fr-FR')} Ar
                      </td>
                      <td className="p-4">{getStatusBadge(m.statut)}</td>

                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          {/* MASQUER MODIFICATION ET CHECK SI TERMINÉE */}
                          {m.statut !== 'Terminée' && (
                            <>
                              <button
                                onClick={() => handleQuickComplete(m)}
                                title={texts.quickCompleteTooltip}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(m)}
                                title={texts.editTooltip}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, items: [m] })}
                            title={texts.deleteTooltip}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
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
                  <td colSpan="7" className="p-12 text-center text-gray-400 text-xs sm:text-sm">
                    {texts.noRecords}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredMaintenances.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 font-semibold">
            <div>
              {texts.showing}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {startIndex + 1}
              </span>{' '}
              {texts.to}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {Math.min(startIndex + itemsPerPage, filteredMaintenances.length)}
              </span>{' '}
              {texts.of}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {filteredMaintenances.length}
              </span>{' '}
              {texts.entries}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 font-bold'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 border border-gray-100 dark:border-gray-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl dark:bg-rose-950/60 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{texts.confirmDeleteTitle}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {texts.confirmDeleteText} <span className="font-bold text-gray-800 dark:text-gray-100">{deleteModal.items.length}</span> {texts.confirmDeleteCount} {texts.confirmDeleteWarning}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700/80">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, items: [] })} 
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-xl dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 font-semibold transition-colors cursor-pointer"
              >
                {texts.cancel}
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
              >
                {texts.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0 shadow-sm">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-white" />
                  <span>{editingId ? texts.modalEditTitle : texts.modalCreateTitle}</span>
                </h2>
                <p className="text-xs text-blue-100 font-normal">
                  {editingId ? texts.modalEditSub : texts.modalCreateSub}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {texts.selectCar} 
                  </label>
                  <div className="relative">
                    <Car className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <select
                      required
                      value={formData.car}
                      onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="">{texts.chooseCar}</option>
                      {cars.map((c) => {
                        const carName = c.name || c.nom || `${c.brand || c.marque || ''} ${c.model || c.modele || ''}`.trim() || 'Véhicule';
                        const carPlate = c.immatriculation || c.car_plate || c.plate || c.plaque || c.registration || c.immat || '';
                        
                        return (
                          <option key={c.id} value={c.id}>
                            {carName} {carPlate ? `(${carPlate})` : `(${texts.noImmat})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {texts.serviceType} 
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <select
                      value={formData.type_service}
                      onChange={(e) => setFormData({ ...formData, type_service: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="Vidange">{texts.servOil}</option>
                      <option value="Réparation">{texts.servRepair}</option>
                      <option value="Contrôle technique">{texts.servTech}</option>
                      <option value="Pneumatique">{texts.servTires}</option>
                      <option value="Autre">{texts.servOther}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {texts.status}
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                  >
                    <option value="Planifiée">{texts.statusPlanned}</option>
                    <option value="En cours">{texts.statusInProg}</option>
                    <option value="Terminée">{texts.statusCompleted}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {texts.cost}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Ex: 150000"
                      value={formData.cout}
                      onChange={(e) => setFormData({ ...formData, cout: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {texts.startDate} 
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="date"
                      required
                      /* AUTORISER LES DATES PASSÉES LORS DE LA MODIFICATION */
                      min={editingId ? undefined : today}
                      value={formData.date_debut}
                      onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {texts.endDate}
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="date"
                      /* AUTORISER LES DATES PASSÉES LORS DE LA MODIFICATION */
                      min={formData.date_debut || (editingId ? undefined : today)}
                      value={formData.date_fin}
                      onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {texts.description}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <textarea
                    rows="3"
                    placeholder={texts.descPlaceholder}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-semibold cursor-pointer transition-colors text-xs sm:text-sm"
                >
                  {texts.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all text-xs sm:text-sm"
                >
                  {editingId ? texts.saveChanges : texts.saveCreate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}