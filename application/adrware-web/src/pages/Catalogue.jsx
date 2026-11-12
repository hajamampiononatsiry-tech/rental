import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Download, Upload, Car as CarIcon, ChevronLeft, ChevronRight, Fuel, Gauge, Users,
  ShieldCheck, ImageIcon, Eye, Printer, X, AlertTriangle, FileText, CheckCircle2, ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'http://localhost:8000/api/cars/';

export default function Catalogue() {
  const { t } = useLanguage();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Disponible': return t('status_available') || 'Disponible';
      case 'En location': return t('status_rented') || 'En location';
      case 'En maintenance': return t('status_maintenance') || 'En maintenance';
      case 'Indisponible': return t('status_unavailable') || 'Indisponible';
      default: return status;
    }
  };

  const getDriverOptionLabel = (option) => {
    switch (option) {
      case 'Sans chauffeur': return t('driver_without') || 'Sans chauffeur';
      case 'Avec chauffeur uniquement': return t('driver_with_only') || 'Avec chauffeur uniquement';
      case 'Les deux': return t('driver_both') || 'Les deux';
      default: return option;
    }
  };

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tous');
  const [selectedSortFilter, setSelectedSortFilter] = useState('default');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [viewingCar, setViewingCar] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ids: [] });

  const [selectedCarIds, setSelectedCarIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const initialFormState = {
    name: '',
    registration: '',
    year: new Date().getFullYear(),
    category: 'Citadine',
    price: '',
    discount: 0,
    fuel: 'Essence',
    transmission: 'Manuelle',
    seats: 5,
    doors: 5,
    airConditioning: true,
    mileage: '',
    status: 'Disponible',
    deposit: '',
    includedMileage: 'Illimité',
    driverOption: 'Sans chauffeur',
    photos: [],
    description: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleNumericChange = (field, e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      [field]: numericValue === '' ? '' : Number(numericValue)
    }));
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setCars(data);
      } else {
        toast.error("Erreur lors du chargement de la flotte.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      toast.error("Erreur réseau lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const filteredCars = React.useMemo(() => {
    let result = cars.filter(car => {
      const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            car.registration.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Toutes' || car.category === selectedCategory;
      const matchesStatus = selectedStatusFilter === 'Tous' || car.status === selectedStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    switch (selectedSortFilter) {
      case 'az':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
        break;
      case 'za':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' }));
        break;
      case 'price_asc':
        result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'year_desc':
        result = [...result].sort((a, b) => Number(b.year) - Number(a.year));
        break;
      case 'random':
        result = [...result].sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }

    return result;
  }, [cars, searchTerm, selectedCategory, selectedStatusFilter, selectedSortFilter]);

  const totalPages = Math.ceil(filteredCars.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCars = filteredCars.slice(indexOfFirstItem, indexOfLastItem);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIdsOnPage = currentCars.map(car => car.id);
      setSelectedCarIds(Array.from(new Set([...selectedCarIds, ...allIdsOnPage])));
    } else {
      const currentIds = currentCars.map(car => car.id);
      setSelectedCarIds(selectedCarIds.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedCarIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleDelete = (id) => setDeleteModal({ isOpen: true, ids: [id] });
  const handleDeleteSelected = () => setDeleteModal({ isOpen: true, ids: selectedCarIds });

  const confirmDelete = async () => {
    try {
      await Promise.all(
        deleteModal.ids.map(id => 
          fetch(`${API_URL}${id}/`, { method: 'DELETE' })
        )
      );
      setCars(cars.filter(car => !deleteModal.ids.includes(car.id)));
      setSelectedCarIds(selectedCarIds.filter(id => !deleteModal.ids.includes(id)));
      toast.success(`${deleteModal.ids.length} véhicule(s) supprimé(s) avec succès !`);
    } catch (error) {
      console.error("Erreur de suppression :", error);
      toast.error("Échec de la suppression du/des véhicule(s).");
    } finally {
      setDeleteModal({ isOpen: false, ids: [] });
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} image(s) ajoutée(s).`);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    toast.success("Image retirée.");
  };

  const exportToExcel = () => {
    if (cars.length === 0) {
      toast.error("Aucune donnée à exporter.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(cars);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flotte_Vehicules");
    XLSX.writeFile(workbook, "Catalogue_Complet_ADRWARE.xlsx");
    toast.success("Catalogue exporté au format Excel !");
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading("Importation en cours...");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        for (const item of data) {
          await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
        }
        await fetchCars();
        toast.success("Importation Excel terminée avec succès !", { id: toastId });
      } catch (err) {
        console.error("Erreur lors de l'import :", err);
        toast.error("Erreur durant l'importation des données.", { id: toastId });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingCar ? 'PUT' : 'POST';
    const url = editingCar ? `${API_URL}${editingCar.id}/` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCars();
        closeModal();
        toast.success(editingCar ? "Véhicule mis à jour avec succès !" : "Nouveau véhicule ajouté !");
      } else {
        toast.error("Erreur lors de l'enregistrement de la voiture.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      toast.error("Erreur de connexion au serveur.");
    }
  };

  const openModal = (car = null) => {
    if (car) {
      setEditingCar(car);
      setFormData(car);
    } else {
      setEditingCar(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCar(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
            currentPage === page
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
          }`}
        >
          {page}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-vehicle-sheet, #printable-vehicle-sheet * {
            visibility: visible !important;
          }
          #printable-vehicle-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CarIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            {t('catalogue_title') || 'Catalogue des Véhicules'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('catalogue_subtitle') || 'Gestion de la flotte, caractéristiques techniques et tarifs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCarIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              {t('delete') || 'Supprimer'} ({selectedCarIds.length})
            </button>
          )}

          <label className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-all whitespace-nowrap shrink-0">
            <Upload className="w-4 h-4" />
            {t('import_excel') || 'Import Excel'}
            <input type="file" accept=".xlsx, .xls" onChange={importFromExcel} className="hidden" />
          </label>

          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            {t('export_excel') || 'Export Excel'}
          </button>

          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('add_vehicle') || 'Ajouter Véhicule'}
          </button>
        </div>
      </div>

      {/* Barre de Recherche, Filtres, Tri Multilingue et Pagination */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
          <input 
            type="text"
            placeholder={t('search_placeholder') || "Rechercher par nom, immatriculation..."}
            value={searchTerm || ''}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedCategory} 
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="Toutes">{t('all_categories') || 'Toutes les catégories'}</option>
            <option value="Citadine">{t('cat_city') || 'Citadine'}</option>
            <option value="SUV">SUV</option>
            <option value="Berline">{t('cat_sedan') || 'Berline'}</option>
            <option value="Utilitaire">{t('cat_utility') || 'Utilitaire'}</option>
            <option value="4x4">4x4</option>
          </select>

          <select 
            value={selectedStatusFilter} 
            onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="Tous">{t('all_statuses') || 'Tous les statuts'}</option>
            <option value="Disponible">{t('status_available') || 'Disponible'}</option>
            <option value="En location">{t('status_rented') || 'En location'}</option>
            <option value="En maintenance">{t('status_maintenance') || 'En maintenance'}</option>
            <option value="Indisponible">{t('status_unavailable') || 'Indisponible'}</option>
          </select>

          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
            <select 
              value={selectedSortFilter} 
              onChange={(e) => { setSelectedSortFilter(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="default">{t('sort_by') || 'Trier par'}</option>
              <option value="az">{t('sort_az') || 'A - Z'}</option>
              <option value="za">{t('sort_za') || 'Z - A'}</option>
              <option value="price_asc">{t('sort_price_asc') || 'Prix croissant'}</option>
              <option value="price_desc">{t('sort_price_desc') || 'Prix décroissant'}</option>
              <option value="year_desc">{t('sort_year_desc') || 'Année récente'}</option>
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
              className="bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>{t('per_page') || 'par page'}</span>
          </div>
        </div>
      </div>

      {/* Tableau des Véhicules */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement de la flotte...</span>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">Aucun véhicule trouvé</p>
            <p className="text-xs mt-1">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-gray-700/40 border-b border-gray-200/80 dark:border-gray-700 text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={currentCars.length > 0 && currentCars.every(car => selectedCarIds.includes(car.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-20">{t('th_photo') || 'Photo'}</th>
                  <th className="p-4">{t('th_vehicle_plate') || 'Véhicule & Plaque'}</th>
                  <th className="p-4">{t('th_specs') || 'Spécifications'}</th>
                  <th className="p-4">{t('th_price_per_day') || 'Prix / Jour'}</th>
                  <th className="p-4">{t('th_deposit') || 'Caution'}</th>
                  <th className="p-4">{t('th_status') || 'Statut'}</th>
                  <th className="p-4 text-center">{t('th_actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                {currentCars.map((car) => {
                  const finalPrice = car.price - (car.price * (car.discount / 100));
                  const isSelected = selectedCarIds.includes(car.id);
                  const hasPhoto = car.photos && car.photos.length > 0;

                  return (
                    <tr key={car.id} className={`hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectOne(car.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="w-14 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
                          {hasPhoto ? (
                            <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover" />
                          ) : (
                            <CarIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{car.name}</span>
                            <span className="text-xs text-gray-400 font-normal">({car.year})</span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5 inline-block bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">{car.registration || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="font-medium text-gray-700 dark:text-gray-300">{car.category} • {car.fuel} • {car.transmission}</div>
                        <div>{car.seats} {t('seats_label') || 'Places'} • {car.mileage ? `${Number(car.mileage).toLocaleString('fr-FR')} km` : 'N/A'}</div>
                      </td>
                      <td className="p-4 font-medium">
                        {car.discount > 0 ? (
                          <div>
                            <span className="line-through text-gray-400 text-xs mr-1">{Number(car.price).toLocaleString('fr-FR')} Ar</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{finalPrice.toLocaleString('fr-FR')} Ar</span>
                            <div className="text-[10px] font-semibold text-rose-500">-{car.discount}% {t('promo') || 'promo'}</div>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-800 dark:text-gray-200">{Number(car.price).toLocaleString('fr-FR')} Ar</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {car.deposit ? `${Number(car.deposit).toLocaleString('fr-FR')} Ar` : '0 Ar'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 ${
                          car.status === 'Disponible' ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          car.status === 'En location' ? 'bg-blue-100/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          car.status === 'En maintenance' ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            car.status === 'Disponible' ? 'bg-emerald-500' :
                            car.status === 'En location' ? 'bg-blue-500' :
                            car.status === 'En maintenance' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                          {getStatusLabel(car.status)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <button 
                            onClick={() => setViewingCar(car)} 
                            title={t('view_sheet') || "Fiche technique & PDF"}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => openModal(car)} 
                            title={t('edit') || "Modifier"}
                            className="bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white dark:bg-purple-950/50 dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDelete(car.id)} 
                            title={t('delete') || "Supprimer"}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold text-center sm:text-left">
            {t('showing') || 'Affichage de'} <span className="font-bold text-gray-700 dark:text-gray-200">{filteredCars.length > 0 ? indexOfFirstItem + 1 : 0}</span> {t('to') || 'à'} <span className="font-bold text-gray-700 dark:text-gray-200">{Math.min(indexOfLastItem, filteredCars.length)}</span> {t('of') || 'sur'} <span className="font-bold text-gray-700 dark:text-gray-200">{filteredCars.length}</span> {t('vehicles') || 'véhicules'}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 px-1">
              {renderPaginationButtons()}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Fiche Technique */}
      {viewingCar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 my-8">
            <div className="p-4 px-6 bg-slate-900 text-white flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>{t('technical_sheet') || 'Fiche Technique & Tarifaire A4'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  {t('print_pdf') || 'Imprimer / Sauvegarder en PDF'}
                </button>
                <button
                  onClick={() => setViewingCar(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-vehicle-sheet" className="p-8 space-y-6 overflow-y-auto bg-white text-gray-900">
              {/* En-tête avec Logo bien arrondi placé avant le titre et le libellé */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-blue-600 shadow-md flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Logo ADRWare" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-blue-600 font-black text-xl tracking-wider uppercase">
                      ADRWARE CAR RENTAL
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('company_subtitle') || 'Gestion & Location de Véhicules de Prestige'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {t('company_location') || 'Antananarivo, Madagascar | contact@adrware.mg'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-mono font-bold text-slate-700 border border-slate-200">
                    TECH-{String(viewingCar.id).padStart(4, '0')}
                  </span>
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      viewingCar.status === 'Disponible' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      viewingCar.status === 'En location' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        viewingCar.status === 'Disponible' ? 'bg-emerald-500' :
                        viewingCar.status === 'En location' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></span>
                      {getStatusLabel(viewingCar.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-wider mb-1 block">
                    {t('vehicle_identification') || 'Identification du Véhicule'}
                  </span>
                  <div className="text-lg font-bold text-slate-900">{viewingCar.name}</div>
                  <div className="text-slate-600 mt-1 font-mono">
                    {t('plate_label') || 'Plaque'} : <span className="font-bold text-slate-900">{viewingCar.registration}</span>
                  </div>
                  <div className="text-slate-500">
                    {t('category_label') || 'Catégorie'} : <span className="font-semibold text-slate-800">{viewingCar.category}</span>
                  </div>
                  <div className="text-slate-500">
                    {t('year_label') || 'Année'} : <span className="font-semibold text-slate-800">{viewingCar.year}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-wider mb-1 block">
                      {t('daily_pricing') || 'Tarification Journalière'}
                    </span>
                    <div className="text-2xl font-black text-blue-600">
                      {(viewingCar.price - (viewingCar.price * (viewingCar.discount / 100))).toLocaleString('fr-FR')} Ar
                      <span className="text-xs font-normal text-slate-500"> {t('per_day') || '/ jour'}</span>
                    </div>
                    {viewingCar.discount > 0 && (
                      <div className="text-xs text-rose-500 line-through font-bold">
                        {Number(viewingCar.price).toLocaleString('fr-FR')} Ar
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t('deposit_required') || 'Caution requise'} : <span className="font-bold text-slate-900">{viewingCar.deposit ? `${Number(viewingCar.deposit).toLocaleString('fr-FR')} Ar` : '0 Ar'}</span>
                  </div>
                </div>
              </div>

              {/* Première Photo Unique */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('vehicle_visual') || 'Visuel du Véhicule'}</h4>
                {viewingCar.photos && viewingCar.photos.length > 0 ? (
                  <div className="h-70 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                    <img src={viewingCar.photos[0]} alt={viewingCar.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-28 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-xs">{t('no_image') || 'Aucune image enregistrée'}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('technical_specs') || 'Caractéristiques Techniques'}</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">{t('characteristic') || 'Caractéristique'}</th>
                        <th className="p-3">{t('specification') || 'Spécification'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-3 font-medium text-slate-500 flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-blue-500" /> {t('fuel_spec') || 'Carburant'}
                        </td>
                        <td className="p-3 font-semibold">{viewingCar.fuel}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-slate-500 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-blue-500" /> {t('transmission_spec') || 'Transmission'}
                        </td>
                        <td className="p-3 font-semibold">{viewingCar.transmission}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-slate-500 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-500" /> {t('capacity_spec') || 'Capacité'}
                        </td>
                        <td className="p-3 font-semibold">{viewingCar.seats} {t('seats_unit') || 'Places'} ({viewingCar.doors} {t('doors_unit') || 'Portes'})</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-slate-500 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-blue-500" /> {t('mileage_spec') || 'Kilométrage'}
                        </td>
                        <td className="p-3 font-semibold">{viewingCar.mileage ? `${Number(viewingCar.mileage).toLocaleString('fr-FR')} km` : (t('not_specified') || 'Non renseigné')}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {t('driver_options_spec') || 'Options de conduite'}
                        </td>
                        <td className="p-3 font-semibold">{getDriverOptionLabel(viewingCar.driverOption)} • {t('included_km') || 'Km inclus'}: {viewingCar.includedMileage}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingCar.description && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('description_equipments') || 'Description & Équipements'}</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {viewingCar.description}
                  </p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('certified_sheet') || 'Fiche technique certifiée ADRWARE Car Rental'}</span>
                </div>
                <span>{t('official_document') || 'Document officiel généré le'} {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout / Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CarIcon className="w-5 h-5" />
                  {editingCar ? (t('edit_vehicle') || 'Modifier le Véhicule') : (t('add_new_vehicle') || 'Ajouter un Nouveau Véhicule')}
                </h2>
                <p className="text-xs text-blue-100 font-normal">
                  {t('create_catalogue_sub') || "Catalogue"}
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    {t('sec_basic_info') || 'Informations de Base'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('make_model') || 'Marque et Modèle'} </label>
                    <input 
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: Peugeot 208, Toyota RAV4"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('plate_number') || 'Immatriculation (Plaque)'} </label>
                    <input 
                      type="text" required value={formData.registration}
                      onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                      placeholder="ex: 1234 TAB"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('registration_year') || 'Année de mise en circulation'}</label>
                    <input 
                      type="text" inputMode="numeric" value={formData.year}
                      onChange={(e) => handleNumericChange('year', e)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category_type') || 'Catégorie / Type'}</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="Citadine">{t('cat_city') || 'Citadine'}</option>
                      <option value="SUV">SUV</option>
                      <option value="Berline">{t('cat_sedan') || 'Berline'}</option>
                      <option value="Utilitaire">{t('cat_utility') || 'Utilitaire'}</option>
                      <option value="4x4">4x4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('price_per_day') || 'Prix de location par jour (Ar)'} </label>
                    <input 
                      type="text" inputMode="numeric" required value={formData.price}
                      onChange={(e) => handleNumericChange('price', e)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('discount_percent') || 'Réduction (%)'}</label>
                    <input 
                      type="text" inputMode="numeric" value={formData.discount}
                      onChange={(e) => handleNumericChange('discount', e)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">2</span>
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    {t('sec_tech_specs') || 'Caractéristiques Techniques & Confort'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fuel_label') || 'Carburant'}</label>
                    <select 
                      value={formData.fuel}
                      onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="Essence">Essence</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybride">Hybride</option>
                      <option value="Électrique">Électrique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transmission_label') || 'Boîte de vitesses'}</label>
                    <select 
                      value={formData.transmission}
                      onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="Manuelle">Manuelle</option>
                      <option value="Automatique">Automatique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('current_mileage') || 'Kilométrage actuel (km)'}</label>
                    <input 
                      type="text" inputMode="numeric" value={formData.mileage}
                      onChange={(e) => handleNumericChange('mileage', e)}
                      placeholder="ex: 45000"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('seats_count') || 'Nombre de places'}</label>
                    <input 
                      type="text" inputMode="numeric" value={formData.seats}
                      onChange={(e) => handleNumericChange('seats', e)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('doors_count') || 'Nombre de portes'}</label>
                    <input 
                      type="text" inputMode="numeric" value={formData.doors}
                      onChange={(e) => handleNumericChange('doors', e)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 cursor-pointer transition-all hover:bg-gray-100/50">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('air_conditioning') || 'Climatisation'}</span>
                      <input 
                        type="checkbox" 
                        checked={formData.airConditioning}
                        onChange={(e) => setFormData({ ...formData, airConditioning: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">3</span>
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    {t('sec_rental_conditions') || 'Conditions de Location & Disponibilité'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('th_status') || 'Statut'}</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="Disponible">{t('status_available') || 'Disponible'}</option>
                      <option value="En location">{t('status_rented') || 'En location'}</option>
                      <option value="En maintenance">{t('status_maintenance') || 'En maintenance'}</option>
                      <option value="Indisponible">{t('status_unavailable') || 'Indisponible'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deposit_amount') || 'Caution / Dépôt (Ar)'}</label>
                    <input 
                      type="text" inputMode="numeric" value={formData.deposit}
                      onChange={(e) => handleNumericChange('deposit', e)}
                      placeholder="ex: 500000"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('included_km_per_day') || 'Kilométrage inclus / jour'}</label>
                    <input 
                      type="text" value={formData.includedMileage}
                      onChange={(e) => setFormData({ ...formData, includedMileage: e.target.value })}
                      placeholder="ex: Illimité ou 200 km/jour"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('driver_option') || 'Option Chauffeur'}</label>
                    <select 
                      value={formData.driverOption}
                      onChange={(e) => setFormData({ ...formData, driverOption: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      <option value="Sans chauffeur">{t('driver_without') || 'Sans chauffeur'}</option>
                      <option value="Avec chauffeur uniquement">{t('driver_with_only') || 'Avec chauffeur uniquement'}</option>
                      <option value="Les deux">{t('driver_both') || 'Les deux'}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">4</span>
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    {t('sec_media_remarks') || 'Médias & Remarques'}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('vehicle_photos') || 'Photos du véhicule'}</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Cliquez pour téléverser <span className="font-normal text-gray-400">(PNG, JPG, WEBP)</span>
                          </p>
                        </div>
                        <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>

                    {formData.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mt-3">
                        {formData.photos.map((ph, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 group shadow-sm">
                            <img src={ph} alt="" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => removePhoto(idx)}
                              className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 shadow-sm transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('desc_remarks') || 'Description / Remarques'}</label>
                    <textarea 
                      rows="3" value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('desc_placeholder') || "État du véhicule, équipements supplémentaires..."}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold transition-all"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  {t('save') || 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {deleteModal.ids.length > 1 
                  ? `${t('delete_confirm_multiple') || 'Supprimer les'} ${deleteModal.ids.length} ${t('vehicles') || 'véhicules'} ?` 
                  : (t('delete_confirm_single') || 'Supprimer le véhicule ?')}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('action_permanent') || 'Cette action est définitive et ne pourra pas être annulée.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, ids: [] })}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {t('delete') || 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}