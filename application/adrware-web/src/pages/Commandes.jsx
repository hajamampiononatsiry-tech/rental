import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Trash2, 
  Edit,
  CheckCircle, 
  Clock, 
  XCircle, 
  Lock, 
  Download, 
  Upload,
  Plus, 
  X, 
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Car,
  Calendar,
  DollarSign,
  Ban,
  ArrowUpDown,
  Filter,
  PlayCircle,
  CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const CURRENT_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const API_BASE_URL = `http://${CURRENT_HOST}:8000/api/reservations/`;
const API_CARS_URL = `http://${CURRENT_HOST}:8000/api/cars/`;
const API_CLIENTS_URL = `http://${CURRENT_HOST}:8000/api/clients/`;
const API_MAINTENANCES_URL = `http://${CURRENT_HOST}:8000/api/maintenances/`;

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80';

const isOrderLocked = (status) => {
  if (!status) return false;
  const lockedStatuses = ['validée', 'validee', 'confirmée', 'confirmee', 'en cours', 'terminée', 'terminee', 'annulée', 'annulee'];
  return lockedStatuses.includes(status.toString().toLowerCase());
};

const getClientFullName = (clientObj) => {
  if (!clientObj) return '';
  if (typeof clientObj === 'string') return clientObj;

  const firstName = clientObj.first_name || clientObj.prenom || '';
  const lastName = clientObj.last_name || clientObj.nom || '';

  const combinedName = `${firstName} ${lastName}`.trim();
  if (combinedName) return combinedName;

  return clientObj.full_name || clientObj.name || clientObj.username || '';
};

const getCarPlateNumber = (carObj) => {
  if (!carObj) return '';
  return carObj.car_plate || carObj.plate || carObj.plaque || carObj.immatriculation || carObj.matricule || carObj.registration || '';
};

const getCarPhotoUrl = (carObj) => {
  if (!carObj) return DEFAULT_CAR_IMAGE;
  
  let rawPhoto = carObj.car_photo || carObj.photos || carObj.car_photos || carObj.image || carObj.car_image || carObj.picture || carObj.file || '';

  if (typeof rawPhoto === 'string' && rawPhoto.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawPhoto);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawPhoto = parsed[0];
      }
    } catch (e) {}
  }

  if (Array.isArray(rawPhoto) && rawPhoto.length > 0) {
    rawPhoto = rawPhoto[0];
  }

  if (typeof rawPhoto === 'object' && rawPhoto !== null) {
    rawPhoto = rawPhoto.image || rawPhoto.file || rawPhoto.url || rawPhoto.photo || '';
  }

  if (typeof rawPhoto === 'string' && rawPhoto.trim() !== '') {
    let cleanPhoto = rawPhoto.trim().replace(/^["\[\s]+|["\]\s]+$/g, '');

    if (cleanPhoto.startsWith('data:image/') || cleanPhoto.startsWith('http://') || cleanPhoto.startsWith('https://')) {
      return cleanPhoto;
    }

    if (cleanPhoto.startsWith('/')) {
      return `http://${CURRENT_HOST}:8000${cleanPhoto}`;
    }
    return `http://${CURRENT_HOST}:8000/${cleanPhoto}`;
  }

  return DEFAULT_CAR_IMAGE;
};

const getCarDisplayLabel = (carObj) => {
  if (!carObj) return '';
  const name = carObj.name || carObj.nom || `${carObj.brand || carObj.marque || ''} ${carObj.model || carObj.modele || ''}`.trim() || 'Véhicule';
  const plate = getCarPlateNumber(carObj);
  const color = carObj.color || carObj.couleur || '';

  let details = [];
  if (plate) details.push(`Plaque: ${plate}`);
  else details.push('Plaque non renseignée');
  
  if (color) details.push(`Couleur: ${color}`);

  return `${name} (${details.join(' - ')})`;
};

export default function Reservations() {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [sortBy, setSortBy] = useState('date_recent');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ids: [] });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newReservation, setNewReservation] = useState({
    clientId: '',
    clientName: '',
    car: '',
    startDate: today,
    endDate: today,
    total: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const getErrorMessage = (errData) => {
    if (!errData) return "Une erreur est survenue.";
    if (typeof errData === 'string') return errData;
    
    if (errData.non_field_errors) {
      return Array.isArray(errData.non_field_errors) 
        ? errData.non_field_errors.join(' ') 
        : errData.non_field_errors;
    }

    if (errData.detail) return errData.detail;
    if (errData.message) return errData.message;

    const messages = [];
    Object.keys(errData).forEach((key) => {
      const val = errData[key];
      if (Array.isArray(val)) {
        messages.push(`${key} : ${val.join(', ')}`);
      } else if (typeof val === 'string') {
        messages.push(`${key} : ${val}`);
      }
    });

    return messages.length > 0 ? messages.join(' | ') : "Erreur de validation lors de l'enregistrement.";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'En attente': return t('pending') || 'En attente';
      case 'Validée':
      case 'Confirmée': return t('confirmed') || 'Confirmée';
      case 'Refusée': return t('refused') || 'Refusée';
      case 'Annulée': return t('canceled') || 'Annulée';
      case 'En cours': return t('in_progress') || 'En cours';
      case 'Terminée': return t('completed') || 'Terminée';
      default: return status;
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(API_CLIENTS_URL);
      if (response.ok) {
        const data = await response.json();
        const sortedClients = [...data].sort((a, b) => {
          const nameA = getClientFullName(a).toLowerCase();
          const nameB = getClientFullName(b).toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setClients(sortedClients);
        return sortedClients;
      }
    } catch (err) {
      console.error("Erreur de chargement des clients :", err);
    }
    return [];
  };

  const fetchCars = async () => {
    try {
      const response = await fetch(API_CARS_URL);
      if (response.ok) {
        const data = await response.json();
        const sortedCars = [...data].sort((a, b) => {
          const nameA = (a.name || a.nom || '').toLowerCase();
          const nameB = (b.name || b.nom || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setCars(sortedCars);
        return sortedCars;
      }
    } catch (err) {
      console.error("Erreur de chargement des voitures :", err);
    }
    return [];
  };

  const fetchMaintenances = async () => {
    try {
      const response = await fetch(API_MAINTENANCES_URL);
      if (response.ok) {
        const data = await response.json();
        setMaintenances(data);
      }
    } catch (err) {
      console.error("Erreur de chargement des maintenances :", err);
    }
  };

  const fetchReservations = async (loadedClientsList = clients, loadedCarsList = cars) => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Erreur de chargement des réservations');
      const data = await response.json();
      
      const formattedOrders = data.map(item => {
        let clientDisplayName = '';

        if (item.client_detail) {
          clientDisplayName = getClientFullName(item.client_detail);
        } else if (typeof item.client === 'object' && item.client !== null) {
          clientDisplayName = getClientFullName(item.client);
        } else if (item.first_name || item.last_name) {
          clientDisplayName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
        } else if (item.client_name) {
          clientDisplayName = item.client_name;
        }

        const rawClientId = item.client_id || (typeof item.client === 'number' || !isNaN(Number(item.client)) ? item.client : null);
        
        if (!clientDisplayName && rawClientId) {
          const matchedClient = loadedClientsList.find(c => String(c.id) === String(rawClientId));
          if (matchedClient) {
            clientDisplayName = getClientFullName(matchedClient);
          }
        }

        if (!clientDisplayName) {
          const matchedByEmailOrPhone = loadedClientsList.find(c => 
            (item.client_email && c.email === item.client_email) || 
            (item.email && c.email === item.email) ||
            (item.phone && (c.phone === item.phone || c.telephone === item.phone))
          );
          if (matchedByEmailOrPhone) {
            clientDisplayName = getClientFullName(matchedByEmailOrPhone);
          }
        }

        if (!clientDisplayName) {
          clientDisplayName = typeof item.client === 'string' ? item.client : 'Client non renseigné';
        }

        const rawCarId = item.car || item.car_id || (item.car_detail && item.car_detail.id);
        const matchedCarObj = loadedCarsList.find(c => String(c.id) === String(rawCarId));

        let carDisplayName = item.car_name || item.car_detail?.name || (matchedCarObj ? (matchedCarObj.name || matchedCarObj.nom || `${matchedCarObj.brand || ''} ${matchedCarObj.model || ''}`.trim()) : 'Véhicule');
        
        let carPlate = item.car_plate || 
                       getCarPlateNumber(matchedCarObj) || 
                       getCarPlateNumber(item.car_detail) || 
                       'Sans plaque';

        let carPhoto = item.car_photo || 
                       getCarPhotoUrl(matchedCarObj) || 
                       getCarPhotoUrl(item.car_detail);

        return {
          id: item.id,
          ref: `#RES-${item.id}`,
          client: clientDisplayName,
          clientId: rawClientId,
          email: item.client_email || item.client_detail?.email || item.email || 'Non renseigné',
          phone: item.client_phone || item.client_detail?.phone || item.phone || 'Non renseigné',
          carId: rawCarId,
          carName: carDisplayName,
          carPlate: carPlate,
          carPhoto: carPhoto,
          startDate: item.start_date,
          endDate: item.end_date,
          total: Number(item.total_price),
          status: item.status,
          origin: item.origin
        };
      });

      setOrders(formattedOrders);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Impossible de récupérer les données du serveur.');
    }
  };

  useEffect(() => {
    const loadAllData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      const loadedClients = await fetchClients();
      const loadedCars = await fetchCars();
      await fetchMaintenances();
      await fetchReservations(loadedClients, loadedCars);
      if (!isBackground) setLoading(false);
    };

    loadAllData(false);

    const interval = setInterval(() => {
      loadAllData(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceConflict = (carId, startDate, endDate) => {
    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    return maintenances.some(m => {
      if (m.statut === 'Terminée') return false;

      const isSameCar = String(m.car) === String(carId) || String(m.car_id) === String(carId);
      if (!isSameCar) return false;

      const maintStart = new Date(m.date_debut || m.start_date);
      const maintEnd = new Date(m.date_fin || m.end_date || m.date_debut || m.start_date);

      return reqStart <= maintEnd && reqEnd >= maintStart;
    });
  };

  const selectableCars = useMemo(() => {
    return cars
      .filter(c => c.status === 'Disponible' || (isEditing && String(c.id) === String(newReservation.car)))
      .sort((a, b) => {
        const nameA = (a.name || a.nom || '').toLowerCase();
        const nameB = (b.name || b.nom || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [cars, isEditing, newReservation.car]);

  const selectedClientObj = useMemo(() => {
    return clients.find(c => String(c.id) === String(newReservation.clientId));
  }, [clients, newReservation.clientId]);

  const selectedCarObj = useMemo(() => {
    if (!newReservation.car) return null;
    return cars.find(c => String(c.id) === String(newReservation.car));
  }, [cars, newReservation.car]);

  useEffect(() => {
    if (newReservation.car && newReservation.startDate && newReservation.endDate) {
      const currentSelectedCar = cars.find(c => String(c.id) === String(newReservation.car));
      const currentSelectedClient = clients.find(c => String(c.id) === String(newReservation.clientId));

      if (currentSelectedCar) {
        const start = new Date(newReservation.startDate);
        const end = new Date(newReservation.endDate);
        
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 0) {
          const rawPrice = Number(currentSelectedCar.price || currentSelectedCar.prix_journalier || 0);
          const carDiscount = Number(currentSelectedCar.discount || currentSelectedCar.remise || 0);
          
          let clientLoyaltyDiscount = 0;
          if (currentSelectedClient) {
            if (currentSelectedClient.discount !== undefined) {
              clientLoyaltyDiscount = Number(currentSelectedClient.discount);
            } else if (currentSelectedClient.taux_fidelite !== undefined) {
              clientLoyaltyDiscount = Number(currentSelectedClient.taux_fidelite);
            } else {
              const rentals = Number(currentSelectedClient.totalRentals || currentSelectedClient.total_rentals || 0);
              if (rentals >= 5) clientLoyaltyDiscount = 15;
              else if (rentals >= 3) clientLoyaltyDiscount = 5;
              else clientLoyaltyDiscount = 0;
            }
          }

          const totalDiscountPercent = Math.min(100, carDiscount + clientLoyaltyDiscount);
          const pricePerDayAfterDiscount = rawPrice - (rawPrice * (totalDiscountPercent / 100));
          const calculatedTotal = diffDays * pricePerDayAfterDiscount;
          
          setNewReservation(prev => ({ ...prev, total: calculatedTotal }));
        } else {
          setNewReservation(prev => ({ ...prev, total: 0 }));
        }
      }
    }
  }, [newReservation.car, newReservation.clientId, newReservation.startDate, newReservation.endDate, cars, clients]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    const defaultClient = clients.length > 0 ? clients[0] : null;
    const defaultCar = selectableCars.length > 0 ? selectableCars[0] : null;

    setNewReservation({
      clientId: defaultClient ? String(defaultClient.id) : '',
      clientName: defaultClient ? getClientFullName(defaultClient) : '',
      car: defaultCar ? String(defaultCar.id) : '',
      startDate: today,
      endDate: today,
      total: 0
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (order) => {
    if (isOrderLocked(order.status)) {
      toast.error("Cette réservation est verrouillée et ne peut plus être modifiée.");
      return;
    }

    setIsEditing(true);
    setEditingId(order.id);
    setNewReservation({
      clientId: order.clientId ? String(order.clientId) : '',
      clientName: order.client,
      car: order.carId ? String(order.carId) : '',
      startDate: order.startDate,
      endDate: order.endDate,
      total: order.total
    });
    setIsAddModalOpen(true);
  };

  const handleClientSelectChange = (clientId) => {
    const selected = clients.find(c => String(c.id) === String(clientId));
    if (selected) {
      setNewReservation(prev => ({
        ...prev,
        clientId: String(selected.id),
        clientName: getClientFullName(selected)
      }));
    } else {
      setNewReservation(prev => ({ ...prev, clientId: String(clientId) }));
    }
  };

  const handleStatusChange = async (id, currentStatus, newStatus, carId) => {
    if (isOrderLocked(currentStatus)) {
      toast.error("Modification impossible : cette réservation est déjà verrouillée !");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
        setSelectedOrderIds(selectedOrderIds.filter(selectedId => selectedId !== id));

        if ((newStatus === 'Confirmée' || newStatus === 'Validée' || newStatus === 'En cours') && carId) {
          await fetch(`${API_CARS_URL}${carId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'En location' }),
          });
          fetchCars();
        } else if (carId) {
          fetchCars();
        }

        await fetchClients();
        if (isOrderLocked(newStatus)) {
          toast.success(`Statut mis à jour : "${newStatus}". La réservation est désormais VERROUILLÉE.`);
        } else {
          toast.success(`Statut modifié vers : "${newStatus}"`);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(getErrorMessage(errData));
      }
    } catch (err) {
      console.error("Erreur de mise à jour du statut :", err);
      toast.error("Erreur réseau lors du changement de statut.");
    }
  };

  const handleSaveReservationSubmit = async (e) => {
    e.preventDefault();

    if (isEditing && isOrderLocked(orders.find(o => o.id === editingId)?.status)) {
      toast.error("Cette réservation est verrouillée et ne peut plus être modifiée.");
      return;
    }

    if (!newReservation.clientId) {
      toast.error("Veuillez sélectionner un client.");
      return;
    }

    if (selectedClientObj && (selectedClientObj.statut === 'banni' || selectedClientObj.is_banned)) {
      toast.error("Impossible d'enregistrer : ce client est actuellement banni !");
      return;
    }

    if (!newReservation.car || !newReservation.startDate || !newReservation.endDate) {
      toast.error("Veuillez remplir tous les champs requis.");
      return;
    }

    const carId = parseInt(newReservation.car, 10);
    const clientId = parseInt(newReservation.clientId, 10);

    if (isNaN(carId) || isNaN(clientId)) {
      toast.error("Sélectionnez un véhicule et un client valides.");
      return;
    }

    if (checkMaintenanceConflict(carId, newReservation.startDate, newReservation.endDate)) {
      toast.error("Impossible d'enregistrer : ce véhicule est en maintenance durant cette période !");
      return;
    }

    const payload = {
      client: clientId,
      car: carId,
      start_date: newReservation.startDate,
      end_date: newReservation.endDate,
      total_price: Number(newReservation.total) || 0
    };

    if (!isEditing) {
      payload.origin = 'SUR_PLACE';
      payload.status = 'Validée';
    }

    try {
      const url = isEditing ? `${API_BASE_URL}${editingId}/` : API_BASE_URL;
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (!isEditing) {
          await fetch(`${API_CARS_URL}${carId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'En location' }),
          });
        }

        const refreshedClients = await fetchClients();
        const refreshedCars = await fetchCars();
        await fetchReservations(refreshedClients, refreshedCars);
        setIsAddModalOpen(false);
        toast.success(isEditing ? "Réservation modifiée avec succès !" : "Réservation sur place enregistrée et verrouillée !");
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(getErrorMessage(errData));
      }
    } catch (err) {
      console.error("Erreur réseau :", err);
      toast.error("Erreur de connexion lors de l'enregistrement.");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const unlockableCurrentIds = currentOrders.filter(o => !isOrderLocked(o.status)).map(o => o.id);
      setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...unlockableCurrentIds])));
    } else {
      const currentIds = currentOrders.map(o => o.id);
      setSelectedOrderIds(selectedOrderIds.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectOne = (id, status) => {
    if (isOrderLocked(status)) {
      toast.error("Impossible de sélectionner : cette réservation est verrouillée.");
      return;
    }
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(
        deleteModal.ids.map(id => 
          fetch(`${API_BASE_URL}${id}/`, { method: 'DELETE' })
        )
      );
      setOrders(orders.filter(o => !deleteModal.ids.includes(o.id)));
      setSelectedOrderIds(selectedOrderIds.filter(id => !deleteModal.ids.includes(id)));
      await fetchClients();
      toast.success(`${deleteModal.ids.length} réservation(s) supprimée(s) !`);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      toast.error("Échec de la suppression.");
    } finally {
      setDeleteModal({ isOpen: false, ids: [] });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let successCount = 0;
        for (const item of data) {
          const payload = {
            client: item.client || item.clientId || 1,
            car: item.car || item.carId || 1,
            start_date: item.start_date || item['Date de début'] || today,
            end_date: item.end_date || item['Date de fin'] || today,
            total_price: Number(item.total_price || item['Montant Total (Ar)'] || 0),
            status: item.status || 'En attente',
            origin: 'IMPORT_EXCEL'
          };

          const res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) successCount++;
        }

        await fetchReservations();
        toast.success(`Importation réussie : ${successCount} réservation(s) ajoutée(s) !`);
      } catch (err) {
        console.error("Erreur import Excel :", err);
        toast.error("Erreur lors de l'importation du fichier.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const clientStr = String(order.client || '').toLowerCase();
      const phoneStr = String(order.phone || '').toLowerCase();
      const carNameStr = String(order.carName || '').toLowerCase();
      const carPlateStr = String(order.carPlate || '').toLowerCase();
      const refStr = String(order.ref || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = 
        clientStr.includes(search) || 
        phoneStr.includes(search) ||
        carNameStr.includes(search) ||
        carPlateStr.includes(search) ||
        refStr.includes(search);

      const matchesStatus = statusFilter === 'Tous' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'a_z') {
      result = [...result].sort((a, b) => (a.client || '').localeCompare(b.client || ''));
    } else if (sortBy === 'z_a') {
      result = [...result].sort((a, b) => (b.client || '').localeCompare(a.client || ''));
    } else if (sortBy === 'date_recent') {
      result = [...result].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    } else if (sortBy === 'date_ancienne') {
      result = [...result].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } else if (sortBy === 'random') {
      result = [...result].sort(() => Math.random() - 0.5);
    }

    return result;
  }, [orders, searchTerm, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error("Aucune réservation à exporter.");
      return;
    }

    const dataToExportSource = selectedOrderIds.length > 0
      ? filteredOrders.filter(o => selectedOrderIds.includes(o.id))
      : filteredOrders;

    const formattedData = dataToExportSource.map(item => ({
      'Référence': item.ref,
      'Client': item.client,
      'Téléphone': item.phone,
      'Email': item.email,
      'Véhicule': item.carName,
      'Plaque d\'immatriculation': item.carPlate,
      'Date de début': item.startDate,
      'Date de fin': item.endDate,
      'Montant Total (Ar)': item.total,
      'Origine': item.origin,
      'Statut': getStatusLabel(item.status)
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Réservations');
    XLSX.writeFile(workbook, `Reservations_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Liste des réservations exportée au format Excel !");
  };

  return (
    <div className="space-y-6 font-sans max-w-[1600px] mx-auto p-2 sm:p-4">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Input caché pour l'import Excel / CSV */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls, .csv" 
        style={{ display: 'none' }} 
      />

      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            {t('reservations_title') || t('reservations') || 'Réservations & Commandes'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('reservations_subtitle') || 'Gérez les réservations de votre flotte, validez les demandes et planifiez la disponibilité des véhicules.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedOrderIds.length > 0 && (
            <button 
              onClick={() => setDeleteModal({ isOpen: true, ids: selectedOrderIds })}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('delete') || 'Supprimer'} ({selectedOrderIds.length})</span>
            </button>
          )}

          {/* Bouton Importation Excel */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-all whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>{t('import_excel') || 'Importer Excel'}</span>
          </button>

          {/* Bouton Exportation Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{selectedOrderIds.length > 0 ? `Exporter (${selectedOrderIds.length})` : (t('export_excel') || 'Export Excel')}</span>
          </button>

          {/* Bouton Ajout */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('new_onsite') || 'Nouveau sur place'}</span> 
          </button>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input 
            type="text"
            placeholder={t('search_placeholder') || "Rechercher par Client, Téléphone, Plaque, Véhicule ou Réf..."}
            value={searchTerm || ''}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="Tous">{t('all_statuses') || 'Tous les statuts'}</option>
              <option value="En attente">{t('pending') || 'En attente'}</option>
              <option value="Confirmée">{t('confirmed') || 'Confirmée'}</option>
              <option value="Refusée">{t('refused') || 'Refusée'}</option>
              <option value="Annulée">{t('canceled') || 'Annulée'}</option>
              <option value="En cours">{t('in_progress') || 'En cours'}</option>
              <option value="Terminée">{t('completed') || 'Terminée'}</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
            <select 
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="date_recent">{t('sort_by') || 'Trier par'}</option>
              <option value="date_recent">{t('sort_date_recent') || 'Date récente'}</option>
              <option value="date_ancienne">{t('sort_date_old') || 'Date ancienne'}</option>
              <option value="a_z">{t('sort_az') || 'A - Z'}</option>
              <option value="z_a">{t('sort_za') || 'Z - A'}</option>
              <option value="random">{t('sort_random') || 'Aléatoire'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold">
            <span>{t('show') || 'Afficher'}</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>{t('per_page') || 'par page'}</span>
          </div>
        </div>
      </div>

      {/* Tableau des Réservations */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs sm:text-sm font-medium">Chargement des données...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs sm:text-sm font-medium">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-200/80 dark:border-gray-700/80 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="p-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={currentOrders.length > 0 && currentOrders.filter(o => !isOrderLocked(o.status)).every(o => selectedOrderIds.includes(o.id))}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                  </th>
                  <th className="p-4 w-24">{t('th_ref') || 'Réf'}</th>
                  <th className="p-4">{t('th_client') || 'Client'}</th>
                  <th className="p-4">{t('th_contact') || 'Contact'}</th>
                  <th className="p-4">{t('th_vehicle_plate') || 'Véhicule & Plaque'}</th>
                  <th className="p-4">{t('th_period') || 'Période'}</th>
                  <th className="p-4">{t('th_total_amount') || 'Montant Total'}</th>
                  <th className="p-4">{t('th_status') || 'Statut'}</th>
                  <th className="p-4 text-center">{t('th_actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
                {currentOrders.length > 0 ? (
                  currentOrders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const locked = isOrderLocked(order.status);

                    return (
                      <tr key={order.id} className={`hover:bg-gray-100/70 dark:hover:bg-gray-700/60 transition-colors ${isSelected ? 'bg-blue-50/40 dark:bg-blue-950/40' : ''} ${locked ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            disabled={locked}
                            onChange={() => handleSelectOne(order.id, order.status)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                          <div className="flex items-center gap-1">
                            {order.ref}
                            {locked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Réservation verrouillée" />}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{order.client}</td>
                        <td className="p-4 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{order.phone}</div>
                          <div className="text-gray-400 truncate max-w-[160px]">{order.email}</div>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={order.carPhoto} 
                              alt={order.carName}
                              className="w-14 h-11 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-xs shrink-0 bg-gray-100"
                              onError={(e) => { e.target.src = DEFAULT_CAR_IMAGE; }}
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 dark:text-gray-200 text-xs truncate">{order.carName}</p>
                              {order.carPlate && order.carPlate !== 'Sans plaque' ? (
                                <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold rounded-md border border-blue-200/80 dark:border-blue-800/80">
                                  {order.carPlate}
                                </span>
                              ) : (
                                <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-semibold rounded-md border border-amber-200/80 dark:border-amber-800/80">
                                  Sans plaque
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{order.startDate} {t('au') || 'au'} {order.endDate}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                          {order.total.toLocaleString('fr-FR')} Ar
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            order.status === 'En cours' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200/85 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/80' :
                            order.status === 'Terminée' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200/85 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/80' :
                            order.status === 'Validée' || order.status === 'Confirmée' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/85 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/80' :
                            order.status === 'En attente' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200/85 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/80' : 
                            order.status === 'Refusée' 
                              ? 'bg-orange-50 text-orange-700 border-orange-200/85 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/80' :
                            'bg-rose-50 text-rose-700 border-rose-200/85 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/80'
                          }`}>
                            {(order.status === 'Validée' || order.status === 'Confirmée') && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                            {order.status === 'En cours' && <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            {order.status === 'Terminée' && <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                            {order.status === 'En attente' && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                            {order.status === 'Annulée' && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            {!locked && order.status === 'En attente' ? (
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, order.status, e.target.value, order.carId)}
                                className="text-[11px] py-1 px-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="En attente">{t('pending') || 'En attente'}</option>
                                <option value="Validée">{t('confirmed') || 'Confirmée'}</option>
                                <option value="Annulée">{t('canceled') || 'Annulée'}</option>
                                <option value="En cours">{t('in_progress') || 'En cours'}</option>
                                <option value="Terminée">{t('completed') || 'Terminée'}</option>
                              </select>
                            ) : null}

                            {locked ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl font-bold text-xs" title="Réservation verrouillée">
                                <Lock className="w-3.5 h-3.5" />
                                <span>{t('locked') || 'Locked'}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenEditModal(order)}
                                title={t('edit') || 'Modifier'}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => setDeleteModal({ isOpen: true, ids: [order.id] })}
                              title={t('delete') || 'Supprimer'}
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
                    <td colSpan="9" className="p-12 text-center text-gray-400 text-xs sm:text-sm">
                      {t('no_reservations_found') || 'Aucune réservation trouvée'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Basse */}
        {!loading && filteredOrders.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold text-xs text-gray-500 dark:text-gray-400">
            <p className="text-center sm:text-left">
              {t('showing') || 'Affichage de'}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {startIndex + 1}
              </span>{' '}
              {t('to') || 'à'}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {Math.min(startIndex + itemsPerPage, filteredOrders.length)}
              </span>{' '}
              {t('of') || 'sur'}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {filteredOrders.length}
              </span>{' '}
              {t('entries') || 'réservations'}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
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
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORMULAIRE MODAL CREATION / MODIFICATION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0 shadow-sm">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white" />
                  <span>{isEditing ? (t('edit_reservation') || 'Modifier la Réservation') : (t('onsite_reservation') || 'Créer une Réservation sur Place')}</span>
                </h2>
                <p className="text-xs text-blue-100 font-normal">
                  {t('create_reservation_sub') || "Affectez directement un véhicule disponible à un client enregistré"}
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReservationSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('select_client') || 'Sélectionner le client'} 
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <select
                    required
                    value={newReservation.clientId}
                    onChange={(e) => handleClientSelectChange(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm border transition-all cursor-pointer ${
                      selectedClientObj && (selectedClientObj.statut === 'banni' || selectedClientObj.is_banned)
                        ? 'border-rose-500 text-rose-600 font-bold focus:ring-2 focus:ring-rose-500/20'
                        : 'border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {getClientFullName(c)} {c.statut === 'banni' || c.is_banned ? '(BANNI)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClientObj && (selectedClientObj.statut === 'banni' || selectedClientObj.is_banned) && (
                  <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                    <Ban className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{t('client_banned_warning') || 'Ce client est banni. Vous ne pouvez pas lui attribuer une réservation.'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('vehicle_plate_label') || "Véhicule (par plaque d'immatriculation)"} 
                </label>
                <div className="relative mb-3">
                  <Car className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <select 
                    required
                    value={newReservation.car}
                    onChange={(e) => setNewReservation({ ...newReservation, car: e.target.value })}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-semibold border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {selectableCars.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {getCarDisplayLabel(v)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCarObj && (
                  <div className="flex items-center gap-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
                    <img 
                      src={getCarPhotoUrl(selectedCarObj)} 
                      alt="Aperçu véhicule" 
                      className="w-20 h-14 rounded-xl object-cover border border-blue-200 dark:border-blue-700 shadow-xs shrink-0 bg-gray-100"
                      onError={(e) => { e.target.src = DEFAULT_CAR_IMAGE; }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {selectedCarObj.name || selectedCarObj.nom || `${selectedCarObj.brand || ''} ${selectedCarObj.model || ''}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[10px] font-bold rounded-md">
                          {getCarPlateNumber(selectedCarObj) || 'Plaque non renseignée'}
                        </span>
                        {selectedCarObj.color && (
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Couleur: {selectedCarObj.color}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('start_date') || 'Date de début'}</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input 
                      type="date" required min={isEditing ? undefined : today}
                      value={newReservation.startDate}
                      onChange={(e) => setNewReservation({ ...newReservation, startDate: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-semibold border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('end_date') || 'Date de fin'}</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input 
                      type="date" required min={newReservation.startDate}
                      value={newReservation.endDate}
                      onChange={(e) => setNewReservation({ ...newReservation, endDate: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-semibold border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">{t('estimated_total_label') || 'Montant Total Estimé'}</span>
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{t('discounts_applied_label') || 'Calculé avec remises cumulées (promo + fidélité)'}</span>
                  </div>
                </div>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {Number(newReservation.total).toLocaleString('fr-FR')} Ar
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-semibold cursor-pointer transition-colors text-xs sm:text-sm"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={selectedClientObj && (selectedClientObj.statut === 'banni' || selectedClientObj.is_banned)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold cursor-pointer shadow-xs transition-all text-xs sm:text-sm"
                >
                  {isEditing ? (t('save_changes') || 'Enregistrer les modifications') : (t('confirm_and_validate') || 'Confirmer et Valider')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl dark:bg-rose-950/60 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t('confirm_delete_title') || 'Confirmer la suppression'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('confirm_delete_msg_multiple') || `Voulez-vous vraiment supprimer ${deleteModal.ids.length} réservation(s) ? Cette action est irréversible.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700/80">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, ids: [] })}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-xl dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 font-semibold transition-colors cursor-pointer"
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
              >
                {t('delete') || 'Oui, Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}