import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Mail, 
  Eye, 
  FileText, 
  CheckCircle, 
  Clock, 
  X,
  Filter,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  CreditCard,
  Trash2,
  AlertTriangle,
  Car as CarIcon,
  ShieldCheck,
  Fuel,
  Gauge,
  Users,
  CheckCircle2,
  ArrowUpDown,
  Plus,
  User,
  Phone,
  QrCode,
  Banknote,
  Check,
  PieChart,
  Layers,
  Ban
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/+esm';

export default function Facturation() {
  const { t } = useLanguage();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Payée':
        return t('paid') || 'Payée';
      case 'Partielle':
        return t('partial') || 'Partiellement payée';
      case 'En attente':
        return t('pending') || 'En attente';
      case 'Expirée':
        return t('expired_unpaid') || 'Expirée (Non payé)';
      default:
        return status;
    }
  };

  const formatPaymentMode = (mode) => {
    if (!mode || mode === 'Non spécifié') {
      return t('not_specified') || 'Non spécifié';
    }
    if (mode.includes('Espèces')) {
      return t('cash_caisse') || mode;
    }
    return mode; 
  };

  const [invoices, setInvoices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, invoice: null });
  const [paymentMethod, setPaymentMethod] = useState('caisse');
  const [amountInput, setAmountInput] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tous');
  const [selectedSortFilter, setSelectedSortFilter] = useState('date_recent');
  const [seed, setSeed] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ids: [] });

  const [emailModal, setEmailModal] = useState({ isOpen: false, invoice: null });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [isSendingBulkEmail, setIsSendingBulkEmail] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [newInvoiceData, setNewInvoiceData] = useState({
    client: '',
    email: '',
    phone: '',
    car: '',
    carCategory: 'Berline',
    carRegistration: '',
    days: 1,
    dailyRate: 0,
    total: '',
    montantPaye: 0,
    typeReservation: 'sur_place',
    status: 'En attente'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [serverIp, setServerIp] = useState('');

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const API_URL = `http://${currentHost}:8000/api/factures/`;
  const RESERVATIONS_API_URL = `http://${currentHost}:8000/api/reservations/`;
  const CLIENTS_API_URL = `http://${currentHost}:8000/api/clients/`;

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      const targetHost = isLocal && serverIp ? serverIp : host;
      return `${window.location.protocol}//${targetHost}:${window.location.port}`;
    }
    return '';
  };

  const fetchServerIp = async () => {
    try {
      const response = await fetch(`http://${currentHost}:8000/api/server-ip/`);
      if (response.ok) {
        const data = await response.json();
        if (data.ip) {
          setServerIp(data.ip);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'IP serveur:", error);
    }
  };

  const getClientFullName = (clientObj) => {
    if (!clientObj) return '';
    if (typeof clientObj === 'string') return isNaN(Number(clientObj)) ? clientObj : '';

    const firstName = clientObj.first_name || clientObj.prenom || '';
    const lastName = clientObj.last_name || clientObj.nom || '';

    const combinedName = `${firstName} ${lastName}`.trim();
    if (combinedName) return combinedName;

    return clientObj.full_name || clientObj.name || clientObj.username || clientObj.client_name || '';
  };

  const resolveClientName = (item, clientsList = clients) => {
    if (!item) return 'Client inconnu';

    if (item.client_name) return item.client_name;
    if (item.nom_client) return item.nom_client;
    if (item.full_name) return item.full_name;

    const directName = `${item.first_name || item.prenom || ''} ${item.last_name || item.nom || ''}`.trim();
    if (directName) return directName;

    if (item.client_detail) {
      const name = getClientFullName(item.client_detail);
      if (name) return name;
    }
    if (item.user_detail) {
      const name = getClientFullName(item.user_detail);
      if (name) return name;
    }
    if (typeof item.client === 'object' && item.client !== null) {
      const name = getClientFullName(item.client);
      if (name) return name;
    }
    if (typeof item.user === 'object' && item.user !== null) {
      const name = getClientFullName(item.user);
      if (name) return name;
    }

    const rawClientId = item.client_id || (typeof item.client === 'number' || (!isNaN(Number(item.client)) && item.client !== null && item.client !== '') ? item.client : null) || item.user_id || (typeof item.user === 'number' ? item.user : null);
    if (rawClientId && clientsList && clientsList.length > 0) {
      const matchedClient = clientsList.find(c => String(c.id) === String(rawClientId));
      if (matchedClient) {
        const name = getClientFullName(matchedClient);
        if (name) return name;
      }
    }

    const clientEmail = item.client_email || item.email || item.client_detail?.email || item.client?.email || item.user?.email;
    const clientPhone = item.client_phone || item.phone || item.telephone || item.client_detail?.phone || item.client?.phone || item.client?.telephone;

    if ((clientEmail || clientPhone) && clientsList && clientsList.length > 0) {
      const matchedByContact = clientsList.find(c => 
        (clientEmail && c.email === clientEmail) ||
        (clientPhone && (c.phone === clientPhone || c.telephone === clientPhone))
      );
      if (matchedByContact) {
        const name = getClientFullName(matchedByContact);
        if (name) return name;
      }
    }

    if (typeof item.client === 'string' && item.client && isNaN(Number(item.client))) {
      return item.client;
    }

    return 'Client inconnu';
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };
      const res = await fetch(CLIENTS_API_URL, { headers });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        return data;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
    return [];
  };

  const fetchReservations = async () => {
    try {
      setLoadingReservations(true);
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const [resResponse] = await Promise.all([
        fetch(RESERVATIONS_API_URL, { headers }),
        clients.length === 0 ? fetchClients() : Promise.resolve(clients)
      ]);

      if (resResponse.ok) {
        const data = await resResponse.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const [facturesRes, loadedClients, loadedReservations] = await Promise.all([
        fetch(API_URL, { headers }),
        fetchClients(),
        fetch(RESERVATIONS_API_URL, { headers }).then(res => res.ok ? res.json() : [])
      ]);

      if (!facturesRes.ok) throw new Error('Erreur réseau lors de la récupération');
      
      const data = await facturesRes.json();
      const today = new Date().toISOString().split('T')[0];
      
      const formattedData = data.map((item) => {
        const clientDisplayName = resolveClientName(item, loadedClients);
        const rawOrigin = String(item.type_reservation || item.reservation_type || item.origin || '').toLowerCase();

        const total = Number(item.montant_total || item.total || 0);
        
        const deposit = Number(
          item.deposit ?? 
          item.caution ?? 
          item.car_deposit ?? 
          item.car_detail?.deposit ?? 
          item.car?.deposit ?? 
          item.reservation_detail?.car?.deposit ?? 
          item.reservation?.car?.deposit ?? 0
        );

        const montantPaye = Number(item.montant_paye || item.paid_amount || 0);
        const resteAPayer = Number(item.reste_a_payer !== undefined ? item.reste_a_payer : Math.max(0, total - montantPaye));
        
        const resId = item.reservation_id || (typeof item.reservation === 'object' ? item.reservation?.id : item.reservation);
        const matchedRes = loadedReservations.find(r => String(r.id) === String(resId));

        const startDate = matchedRes?.start_date || matchedRes?.date_debut || item.start_date || item.date_debut || item.reservation_detail?.start_date || item.reservation_detail?.date_debut || item.reservation?.start_date || item.reservation?.date_debut || item.date || new Date().toISOString().split('T')[0];
        const endDate = matchedRes?.end_date || matchedRes?.date_fin || item.end_date || item.date_fin || item.reservation_detail?.end_date || item.reservation_detail?.date_fin || item.reservation?.end_date || item.reservation?.date_fin || item.date || new Date().toISOString().split('T')[0];

        let days = Number(item.duration_days || item.days || item.reservation_detail?.duration_days || item.reservation?.duration_days || 0);
        if (matchedRes) {
          days = Number(matchedRes.duration_days || matchedRes.days || matchedRes.nombre_jours || 0);
        }
        if (!days && startDate && endDate) {
          const diffTime = new Date(endDate).getTime() - new Date(startDate).getTime();
          days = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));
        }
        if (!days) days = 1;

        let status = item.statut || item.status || 'En attente';
        // Vérification frontend de l'expiration pour non-paiement à la date de début
        if (status === 'En attente' && montantPaye === 0 && startDate < today) {
          status = 'Expirée';
        }

        return {
          rawId: item.id,
          id: item.reference || `FAC-${new Date(item.date_emission || Date.now()).getFullYear()}-${String(item.id).padStart(3, '0')}`,
          client: clientDisplayName,
          email: item.client_email || item.email || item.client_detail?.email || '',
          phone: item.client_phone || item.phone || item.client_detail?.phone || '',
          car: item.car_name || item.car_detail?.name || 'Véhicule',
          carCategory: item.car_category || 'Berline',
          carRegistration: item.car_registration || 'N/A',
          carImage: item.car_image || '',
          fuel: item.fuel || 'Essence',
          transmission: item.transmission || 'Manuelle',
          seats: item.seats || 5,
          deposit: deposit,
          includedMileage: item.included_mileage || 'Illimité',
          driverOption: item.driver_option || 'Sans chauffeur',
          days: days,
          startDate: startDate,
          endDate: endDate,
          total: total,
          montantPaye: montantPaye,
          resteAPayer: resteAPayer,
          modePaiement: item.mode_paiement || 'Non spécifié',
          date: item.date_emission ? item.date_emission.split('T')[0] : new Date().toISOString().split('T')[0],
          status: status,
          typeReservation: (rawOrigin.includes('ligne') || rawOrigin.includes('mobile')) ? 'mobile' : 'sur_place',
          itemsList: [{
            car: item.car_name || item.car_detail?.name || 'Véhicule',
            carCategory: item.car_category || 'Berline',
            carRegistration: item.car_registration || 'N/A',
            carImage: item.car_image || '',
            days: days,
            startDate: startDate,
            endDate: endDate,
            total: total,
            deposit: deposit
          }]
        };
      });

      // Filtrer pour masquer complètement les factures expirées/annulées par non-paiement
      const activeInvoices = formattedData.filter(inv => inv.status !== 'Expirée');
      setInvoices(activeInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerIp();
    fetchInvoices();
    fetchReservations();

    const interval = setInterval(() => {
      fetchInvoices();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleGroupAndInvoiceSelected = () => {
    if (selectedInvoiceIds.length < 2) {
      toast.error(t('select_at_least_two_invoices') || "Veuillez sélectionner au moins 2 factures à regrouper.");
      return;
    }

    const selectedItems = invoices.filter(inv => selectedInvoiceIds.includes(inv.rawId));
    
    const firstClient = selectedItems[0].client;
    const hasDifferentClients = selectedItems.some(inv => inv.client !== firstClient);

    if (hasDifferentClients) {
      toast.error(t('combine_different_clients_error') || "❌ Impossible de combiner : les factures sélectionnées appartiennent à des clients différents !");
      return;
    }

    const firstDate = selectedItems[0].date;

    let combinedTotal = 0;
    let combinedDeposit = 0;
    let combinedMontantPaye = 0;
    let allCars = [];
    let allItemsList = [];
    let minStartDate = selectedItems[0].startDate;
    let maxEndDate = selectedItems[0].endDate;

    selectedItems.forEach(inv => {
      combinedTotal += inv.total;
      combinedDeposit += inv.deposit;
      combinedMontantPaye += inv.montantPaye;
      
      if (inv.startDate && (!minStartDate || new Date(inv.startDate) < new Date(minStartDate))) {
        minStartDate = inv.startDate;
      }
      if (inv.endDate && (!maxEndDate || new Date(inv.endDate) > new Date(maxEndDate))) {
        maxEndDate = inv.endDate;
      }

      if (inv.itemsList && inv.itemsList.length > 0) {
        allItemsList.push(...inv.itemsList);
      } else {
        allItemsList.push({
          car: inv.car,
          carCategory: inv.carCategory,
          carRegistration: inv.carRegistration,
          carImage: inv.carImage,
          days: inv.days,
          startDate: inv.startDate,
          endDate: inv.endDate,
          total: inv.total,
          deposit: inv.deposit
        });
      }
      allCars.push(inv.car);
    });

    const consolidatedInvoice = {
      rawId: 'GROUP-' + Date.now(),
      rawIds: selectedInvoiceIds,
      id: `FAC-GRP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client: firstClient,
      email: selectedItems[0].email,
      phone: selectedItems[0].phone,
      car: allCars.join(', '),
      carCategory: selectedItems[0].carCategory,
      carRegistration: selectedItems[0].carRegistration,
      carImage: selectedItems[0].carImage,
      deposit: combinedDeposit,
      days: selectedItems[0].days,
      startDate: minStartDate,
      endDate: maxEndDate,
      total: combinedTotal,
      montantPaye: combinedMontantPaye,
      resteAPayer: Math.max(0, combinedTotal - combinedMontantPaye),
      modePaiement: selectedItems[0].modePaiement,
      date: firstDate,
      status: combinedMontantPaye >= combinedTotal ? 'Payée' : combinedMontantPaye > 0 ? 'Partielle' : 'En attente',
      typeReservation: selectedItems[0].typeReservation,
      itemsList: allItemsList
    };

    if (consolidatedInvoice.status === 'En attente') {
      toast.error(t('preview_blocked_pending') || "❌ Aperçu impossible : aucun règlement n'a été enregistré sur cette facture groupée !");
      return;
    }

    setSelectedInvoice(consolidatedInvoice);
    toast.success(t('grouped_invoice_success') || "Facture groupée générée avec succès !");
  };

  const handleOpenPreview = (inv) => {
    if (inv.status === 'En attente' || inv.montantPaye === 0) {
      toast.error(t('preview_blocked_pending') || "❌ Aperçu impossible : la facture est en attente et aucun règlement (caution ou acompte) n'a été enregistré !");
      return;
    }
    setSelectedInvoice(inv);
  };

  const handleReservationSelect = (resId) => {
    setSelectedReservationId(resId);
    if (!resId) {
      resetCreateForm();
      return;
    }

    const selectedRes = reservations.find((r) => String(r.id) === String(resId));
    if (selectedRes) {
      const clientName = resolveClientName(selectedRes, clients);
      const clientEmail = selectedRes.client_email || selectedRes.email || selectedRes.client_detail?.email || selectedRes.client?.email || selectedRes.user?.email || '';
      const clientPhone = selectedRes.client_phone || selectedRes.phone || selectedRes.telephone || selectedRes.client_detail?.phone || selectedRes.client?.phone || selectedRes.client?.telephone || '';
      const resOrigin = String(selectedRes.origin || selectedRes.type_reservation || '').toLowerCase();

      let days = 1;
      const startDateStr = selectedRes.start_date || selectedRes.date_debut || new Date().toISOString().split('T')[0];
      const endDateStr = selectedRes.end_date || selectedRes.date_fin || new Date().toISOString().split('T')[0];

      if (startDateStr && endDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        days = Math.max(1, diffDays);
      } else {
        days = Number(selectedRes.duration_days || selectedRes.days || selectedRes.nombre_jours || 1);
      }

      const total = Number(selectedRes.total_price || selectedRes.montant_total || 0);

      setNewInvoiceData((prev) => ({
        ...prev,
        client: clientName,
        email: clientEmail,
        phone: clientPhone,
        car: selectedRes.car_name || selectedRes.car?.name || 'Véhicule',
        carCategory: selectedRes.car_category || selectedRes.car?.category || 'Berline',
        carRegistration: selectedRes.car_registration || selectedRes.car?.registration || 'N/A',
        days: days,
        startDate: startDateStr,
        endDate: endDateStr,
        total: total,
        montantPaye: 0,
        typeReservation: (resOrigin.includes('ligne') || resOrigin.includes('mobile')) ? 'mobile' : 'sur_place',
      }));
    }
  };

  const resetCreateForm = () => {
    setSelectedReservationId('');
    setNewInvoiceData({
      client: '',
      email: '',
      phone: '',
      car: '',
      carCategory: 'Berline',
      carRegistration: '',
      days: 1,
      startDate: '',
      endDate: '',
      total: '',
      montantPaye: 0,
      typeReservation: 'sur_place',
      status: 'En attente'
    });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedReservationId) {
      toast.error(t('select_reservation_error') || "Veuillez sélectionner une réservation.");
      return;
    }

    setIsCreating(true);
    const token = localStorage.getItem('accessToken');

    const payload = {
      reservation: selectedReservationId,
      statut: newInvoiceData.status,
      duration_days: newInvoiceData.days,
      total: newInvoiceData.total,
      montant_paye: Number(newInvoiceData.montantPaye || 0)
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(t('invoice_created_success') || "Facture créée avec succès !");
        setCreateModalOpen(false);
        resetCreateForm();
        fetchInvoices();
      } else {
        const errorData = await response.json();
        toast.error(errorData.reservation ? errorData.reservation[0] : (t('invoice_create_error') || "Erreur lors de la création de la facture."));
      }
    } catch (error) {
      console.error("Erreur de création de facture:", error);
      toast.error(t('network_error') || "Erreur réseau lors de la création.");
    } finally {
      setIsCreating(false);
    }
  };

  const openPaymentModal = (invoice) => {
    const latestInvoice = invoices.find(inv => inv.rawId === invoice.rawId) || invoice;
    setPaymentModal({ isOpen: true, invoice: latestInvoice });
    setPaymentMethod('caisse');
    setAmountInput(latestInvoice.resteAPayer > 0 ? latestInvoice.resteAPayer : latestInvoice.total);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    const invoice = paymentModal.invoice;
    if (!invoice) return;

    const latestInvoice = invoices.find(inv => inv.rawId === invoice.rawId) || invoice;
    const currentMontantPaye = Number(latestInvoice.montantPaye || 0);
    const currentTotal = Number(latestInvoice.total || 0);
    const currentResteAPayer = Number(latestInvoice.reste_a_payer !== undefined ? latestInvoice.reste_a_payer : Math.max(0, currentTotal - currentMontantPaye));

    const verseMontant = Number(amountInput);
    if (isNaN(verseMontant) || verseMontant <= 0) {
      toast.error(t('enter_valid_amount') || "Veuillez saisir un montant valide.");
      return;
    }

    const totalDeposit = Number(latestInvoice.deposit || 0);
    if (totalDeposit > 0 && currentMontantPaye < totalDeposit && (currentMontantPaye + verseMontant) < totalDeposit) {
      toast.error(t('deposit_blocking_error') || `❌ BLOCAGE : La caution de ${formatCurrency(totalDeposit)} Ar n'a pas été payée avant le départ ! Le règlement intégral de la caution est obligatoire.`);
      return;
    }

    if (verseMontant > currentResteAPayer) {
      toast.error(t('amount_exceeds_remaining') || `Le montant versé dépasse le reste à payer (${formatCurrency(currentResteAPayer)} Ar).`);
      return;
    }

    setProcessingPaymentId(latestInvoice.rawId);
    const token = localStorage.getItem('accessToken');

    const newMontantPaye = currentMontantPaye + verseMontant;

    const payload = {
      montant_paye: newMontantPaye,
      mode_paiement: 'Espèces',
      reference_transaction: 'ESP-' + Date.now().toString().slice(-6),
      telephone_paiement: ''
    };

    try {
      const response = await fetch(`${API_URL}${latestInvoice.rawId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`${t('payment_success_msg') || 'Règlement enregistré avec succès !'}`);
        
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        setPaymentModal({ isOpen: false, invoice: null });
        fetchInvoices();
      } else {
        toast.error(t('payment_error') || "Erreur lors de la mise à jour du statut de paiement.");
      }
    } catch (error) {
      console.error('Erreur réseau lors du paiement:', error);
      toast.error(t('network_error') || "Erreur réseau.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleDelete = (rawId) => setDeleteModal({ isOpen: true, ids: [rawId] });
  const handleDeleteSelected = () => setDeleteModal({ isOpen: true, ids: selectedInvoiceIds });

  const confirmDelete = async () => {
    const token = localStorage.getItem('accessToken');

    try {
      await Promise.all(
        deleteModal.ids.map(id => 
          fetch(`${API_URL}${id}/`, { 
            method: 'DELETE',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            }
          })
        )
      );
      setInvoices(invoices.filter(inv => !deleteModal.ids.includes(inv.rawId)));
      setSelectedInvoiceIds(selectedInvoiceIds.filter(id => !deleteModal.ids.includes(id)));
      toast.success(`${deleteModal.ids.length} ${t('invoice_deleted') || 'facture(s) supprimée(s) avec succès !'}`);
    } catch (error) {
      console.error("Erreur de suppression :", error);
      toast.error(t('delete_error') || "Échec de la suppression de la/des facture(s).");
    } finally {
      setDeleteModal({ isOpen: false, ids: [] });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIdsOnPage = paginatedInvoices.map(inv => inv.rawId);
      setSelectedInvoiceIds(Array.from(new Set([...selectedInvoiceIds, ...allIdsOnPage])));
    } else {
      const currentIds = paginatedInvoices.map(inv => inv.rawId);
      setSelectedInvoiceIds(selectedInvoiceIds.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectOne = (rawId) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(rawId) ? prev.filter(selectedId => selectedId !== rawId) : [...prev, rawId]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  const getEmailDefaultMessage = (invoice) => {
    if (!invoice) return '';
    const clientName = invoice.client;
    const ref = invoice.id;
    
    let carsDescription = '';
    if (invoice.itemsList && invoice.itemsList.length > 1) {
      carsDescription = invoice.itemsList.map(item => 
        `- ${item.car} (Catégorie : ${item.carCategory} - Immat : ${item.carRegistration} | Du ${item.startDate} au ${item.endDate}, ${item.days} ${item.days > 1 ? 'jours' : 'jour'})`
      ).join('\n');
    } else {
      carsDescription = `${invoice.car} (${invoice.carCategory} - Immat: ${invoice.carRegistration})`;
    }

    const isMulti = invoice.itemsList && invoice.itemsList.length > 1;
    const vehicleText = isMulti ? `les véhicules suivants :\n\n${carsDescription}` : `le véhicule ${carsDescription}`;

    return `Madame, Monsieur ${clientName},\n\nNous tenons à vous exprimer nos sincères remerciements pour avoir choisi ADRWARE Car Rental pour vos déplacements. Votre fidélité et votre confiance sont les moteurs de notre engagement quotidien pour vous offrir un service irréprochable.\n\nNous avons le plaisir de vous transmettre ci-joint votre facture officielle n° ${ref} concernant ${vehicleText}.\n\n📊 Récapitulatif financier :\n• Montant total de la prestation : ${formatCurrency(invoice.total)} Ar\n• Montant déjà réglé : ${formatCurrency(invoice.montantPaye)} Ar\n• Reste à solder : ${formatCurrency(invoice.resteAPayer)} Ar\n\nNotre équipe reste à votre entière disposition pour toute assistance complémentaire. Nous vous souhaitons une excellente route et espérons avoir le plaisir de vous accompagner à nouveau très prochainement.\n\nBien cordialement,\nLe service client - ADRWARE Car Rental\n☎ Téléphone: +261 38 93 346 87 | ✉ E-mail: adrwarecontact@gmail.com`;
  };

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter((inv) => {
      const matchesSearch =
        inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.car.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === 'Tous' || inv.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      const nameA = a.client.toLowerCase();
      const nameB = b.client.toLowerCase();
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;

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
          return Math.sin(a.rawId + seed) - Math.sin(b.rawId + seed);
        default:
          return 0;
      }
    });
  }, [invoices, searchTerm, selectedStatusFilter, selectedSortFilter, seed]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setSelectedStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortFilterChange = (e) => {
    setSelectedSortFilter(e.target.value);
    if (e.target.value === 'random') {
      setSeed(Math.random());
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (emailModal.invoice?.status === 'En attente') {
      toast.error(t('send_email_pending_error') || "Impossible d'envoyer une facture sans aucun règlement enregistré.");
      return;
    }

    setIsSendingEmail(true);

    const token = localStorage.getItem('accessToken');
    const form = e.target;

    const emailPayload = {
      email: form.elements[0].value,
      subject: form.elements[1].value,
      message: form.elements[2].value,
      ...(emailModal.invoice.rawIds ? { invoice_ids: emailModal.invoice.rawIds } : { invoice_id: emailModal.invoice.rawId })
    };

    try {
      const response = await fetch(`http://${currentHost}:8000/api/factures/send-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(emailPayload),
      });

      if (response.ok) {
        toast.success(t('email_sent_success') || "Facture envoyée par e-mail avec succès !");
        setEmailModal({ isOpen: false, invoice: null });
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || errData.detail || (t('email_send_error') || "Échec de l'envoi de l'email."));
      }
    } catch (error) {
      console.error("Erreur d'envoi d'email:", error);
      toast.error(t('network_error') || "Erreur réseau lors de l'envoi de l'email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    setIsSendingBulkEmail(true);

    const token = localStorage.getItem('accessToken');
    const form = e.target;
    const customSubject = form.elements['bulk-subject'].value;
    const customMessage = form.elements['bulk-message'].value;

    const selectedInvoices = invoices.filter(
      (inv) => selectedInvoiceIds.includes(inv.rawId) && inv.email && inv.status !== 'En attente'
    );

    if (selectedInvoices.length === 0) {
      toast.error(t('no_valid_invoices_email') || "Aucune facture valide n'a d'adresse e-mail ou de règlement effectué.");
      setIsSendingBulkEmail(false);
      return;
    }

    try {
      const sendPromises = selectedInvoices.map((inv) => {
        const emailPayload = {
          email: inv.email,
          subject: customSubject.replaceAll('{id}', inv.id),
          message: customMessage.replaceAll('{client}', inv.client).replaceAll('{id}', inv.id),
          invoice_id: inv.rawId,
        };

        return fetch(`http://${currentHost}:8000/api/factures/send-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(emailPayload),
        });
      });

      const results = await Promise.all(sendPromises);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast.success(`${selectedInvoices.length} ${t('emails_sent_success') || 'e-mail(s) envoyé(s) avec succès !'}`);
        setBulkEmailModalOpen(false);
        setSelectedInvoiceIds([]);
      } else {
        toast.error(t('some_emails_failed') || "Certains e-mails n'ont pas pu être envoyés.");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi groupé d'e-mails :", error);
      toast.error(t('network_error') || "Erreur réseau lors de l'envoi groupé.");
    } finally {
      setIsSendingBulkEmail(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Factures');

      worksheet.columns = [
        { header: t('th_invoice_ref') || 'N° Facture', key: 'id', width: 18 },
        { header: t('client') || 'Client', key: 'client', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: t('vehicle') || 'Véhicule', key: 'car', width: 20 },
        { header: t('payment_mode') || 'Mode Paiement', key: 'modePaiement', width: 18 },
        { header: t('th_total_amount') || 'Total (Ar)', key: 'total', width: 16 },
        { header: t('paid_amount') || 'Payé (Ar)', key: 'montantPaye', width: 16 },
        { header: t('remaining_amount') || 'Reste (Ar)', key: 'resteAPayer', width: 16 },
        { header: t('date') || 'Date', key: 'date', width: 15 },
        { header: t('status') || 'Statut', key: 'status', width: 15 },
        { header: t('qr_code') || 'Code QR', key: 'qr', width: 16 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      for (let i = 0; i < filteredInvoices.length; i++) {
        const inv = filteredInvoices[i];
        const rowIndex = i + 2;

        worksheet.addRow({
          id: inv.id,
          client: inv.client,
          email: inv.email,
          car: inv.car,
          modePaiement: inv.modePaiement,
          total: inv.total,
          montantPaye: inv.montantPaye,
          resteAPayer: inv.resteAPayer,
          date: inv.date,
          status: getStatusLabel(inv.status),
          qr: '',
        });

        worksheet.getRow(rowIndex).height = 65;
        worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'left' };

        const verifyUrl = `${getBaseUrl()}/verify?id=${inv.rawId}&ref=${inv.id}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`;

        const response = await fetch(qrUrl);
        const arrayBuffer = await response.arrayBuffer();

        const imageId = workbook.addImage({
          buffer: arrayBuffer,
          extension: 'png',
        });

        worksheet.addImage(imageId, {
          tl: { col: 10, row: rowIndex - 1 },
          ext: { width: 75, height: 75 },
          editAs: 'oneCell',
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(
        blob,
        `Factures_ADRWARE_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      toast.success(t('excel_exported_success') || "Factures exportées au format Excel !");
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel :", error);
      toast.error(t('excel_export_error') || "Erreur lors de l'exportation Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto p-2 sm:p-4">
      <Toaster position="top-right" reverseOrder={false} />

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-sheet, #printable-invoice-sheet * {
            visibility: visible !important;
          }
          #printable-invoice-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 13px !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* En-tête Principal de la page */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200/60 dark:border-gray-800 print:hidden w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2  text-blue-600 rounded-xl">
              <FileText className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('facturation_title') || t('facturation') || 'Facturation'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 pl-11">
            {t('facturation_subtitle') ||
              'Générez, imprimez et envoyez les factures avec suivi des encaissements partiels.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full lg:w-auto">
          {selectedInvoiceIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              {selectedInvoiceIds.length >= 2 && (
                <button
                  onClick={handleGroupAndInvoiceSelected}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                  title="Regrouper et facturer la sélection"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{t('combine') || 'Combiner'} ({selectedInvoiceIds.length})</span>
                </button>
              )}

              <button
                onClick={() => setBulkEmailModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                title="Envoyer les e-mails en masse"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t('emails') || 'emails'} ({selectedInvoiceIds.length})</span>
              </button>

              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                title="Supprimer la sélection"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>{t('delete') || 'Supprimer'}</span>
              </button>
            </div>
          )}

          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{isExporting ? (t('generating_excel') || 'Export...') : (t('export_excel') || 'Export Excel')}</span>
          </button>

          <button
            onClick={() => {
              fetchReservations();
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t('create_invoice') || 'Créer une facture'}</span>
          </button>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={
              t('search_placeholder') ||
              'Rechercher par N° Facture, Client ou Véhicule...'
            }
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
          <select
            value={selectedStatusFilter}
            onChange={handleStatusFilterChange}
            className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="Tous">{t('all_statuses') || 'Tous les statuts'}</option>
            <option value="Payée">{t('paid') || 'Payée'}</option>
            <option value="Partielle">{t('partial') || 'Partiellement payée'}</option>
            <option value="En attente">{t('pending') || 'En attente'}</option>
          </select>

          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
            <select
              value={selectedSortFilter}
              onChange={handleSortFilterChange}
              className="pl-9 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="date_recent">{t('sort_by') || 'Trier par'}</option>
              <option value="date_recent">{t('sort_date_recent') || 'Date récente'}</option>
              <option value="date_old">{t('sort_date_old') || 'Date ancienne'}</option>
              <option value="az">{t('sort_az') || 'A - Z'}</option>
              <option value="za">{t('sort_za') || 'Z - A'}</option>
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
              className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-gray-800 dark:text-gray-200"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>{t('per_page') || 'par page'}</span>
          </div>
        </div>
      </div>

      {/* Tableau des Factures */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-200/80 dark:border-gray-700/80 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={paginatedInvoices.length > 0 && paginatedInvoices.every(inv => selectedInvoiceIds.includes(inv.rawId))}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="p-4">{t('th_invoice_ref') || 'N° Facture'}</th>
                <th className="p-4">{t('client') || 'Client'}</th>
                <th className="p-4">{t('vehicle') || 'Véhicule'}</th>
                <th className="p-4">{t('payment_mode') || 'Paiement'}</th>
                <th className="p-4">{t('th_total_amount') || 'Total'}</th>
                <th className="p-4">{t('tracking_collected') || 'Suivi Encaissé'}</th>
                <th className="p-4">{t('status') || 'Statut'}</th>
                <th className="p-4 text-center">{t('th_actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="font-medium text-xs sm:text-sm">{t('loading_invoices') || 'Chargement des factures...'}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => {
                  const isSelected = selectedInvoiceIds.includes(inv.rawId);
                 
                  return (
                    <tr
                      key={inv.rawId}
                      className={`group hover:bg-gray-100/70 dark:hover:bg-gray-700/60 transition-all duration-150 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-950/40' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectOne(inv.rawId)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs sm:text-sm">
                              {inv.id}
                            </span>
                            <span className="block text-[11px] text-gray-400 font-mono mt-0.5">{inv.date}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate max-w-[160px] text-xs sm:text-sm">
                              {inv.client}
                            </span>
                            {inv.phone && <span className="text-[11px] text-gray-400 block mt-0.5">{inv.phone}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <CarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 block truncate max-w-[150px] text-xs sm:text-sm">
                              {inv.car}
                            </span>
                            <span className="text-[11px] text-gray-400 block mt-0.5">{inv.days} {inv.days > 1 ? (t('days') || 'jours') : (t('day') || 'jour')}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/50">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {formatPaymentMode(inv.modePaiement)}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        {formatCurrency(inv.total)} <span className="text-xs font-normal text-gray-400">Ar</span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            {t('paid_label') || 'Payé'} : {formatCurrency(inv.montantPaye)} Ar
                          </div>
                          {inv.resteAPayer > 0 ? (
                            <div className="font-bold text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                              {t('remaining_label') || 'Reste'} : {formatCurrency(inv.resteAPayer)} Ar
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-[11px] block font-medium">{t('fully_settled') || 'Solde totalement réglé'}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            inv.status === 'Payée'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                              : inv.status === 'Partielle'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200/80 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/60'
                          }`}
                        >
                          {inv.status === 'Payée' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : inv.status === 'Partielle' ? (
                            <PieChart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                          )}
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenPreview(inv)}
                            title={t('view_invoice') || 'Voir la facture'}
                            className={`p-2.5 rounded-xl border transition-all shadow-xs flex items-center justify-center cursor-pointer ${
                              inv.status === 'En attente' || inv.montantPaye === 0
                                ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700 hover:bg-gray-200'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {inv.status !== 'Payée' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              disabled={processingPaymentId === inv.rawId}
                              title={t('register_payment') || "Enregistrer un versement"}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                              {processingPaymentId === inv.rawId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(inv.rawId)}
                            title={t('delete') || "Supprimer"}
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
                    {t('no_invoices_found') || 'Aucune facture trouvée'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredInvoices.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/20">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold text-center sm:text-left">
              {t('showing') || 'Affichage de'}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {startIndex + 1}
              </span>{' '}
              {t('to') || 'à'}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {Math.min(startIndex + itemsPerPage, filteredInvoices.length)}
              </span>{' '}
              {t('of') || 'sur'}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {filteredInvoices.length}
              </span>{' '}
              {t('invoices_count_label') || 'factures'}
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
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 font-bold'
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

      {/* MODALE DE CREATION DE FACTURE */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0 shadow-sm">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  <span>{t('create_invoice_from_reservation') || 'Créer une facture depuis une réservation'}</span>
                </h2>
                <p className="text-xs text-blue-100 font-normal">
                  {t('create_invoice_sub') || "Générez un document comptable officiel à partir d'une réservation validée"}
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('select_reservation') || 'Sélectionner une réservation'} 
                </label>
                <select
                  required
                  value={selectedReservationId}
                  onChange={(e) => handleReservationSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                >
                  <option value="">{t('choose_reservation_placeholder') || '-- Choisir une réservation --'}</option>
                  {reservations.map((res) => {
                    const clientName = resolveClientName(res, clients);
                    const carName = res.car_name || res.car?.name || 'Véhicule';
                    return (
                      <option key={res.id} value={res.id}>
                        #{res.id} - {clientName} ({carName})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedReservationId && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-3">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    {t('data_preview') || 'Aperçu des données :'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">{t('client') || 'Client'} :</span> <strong className="text-gray-800 dark:text-gray-100 block truncate font-semibold">{newInvoiceData.client || 'N/A'}</strong></div>
                    <div><span className="text-gray-500">{t('vehicle') || 'Véhicule'} :</span> <strong className="text-gray-800 dark:text-gray-100 block truncate font-semibold">{newInvoiceData.car || 'N/A'}</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/60 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('duration') || 'Durée'} ({t('days') || 'jours'}) :
                      </label>
                      <input
                        type="number"
                        readOnly
                        disabled
                        value={newInvoiceData.days}
                        className="w-full px-3 py-2 bg-gray-200/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 text-xs cursor-not-allowed select-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('already_paid_label') || 'Déjà Payé (Ar)'} :
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newInvoiceData.montantPaye}
                        onChange={(e) => setNewInvoiceData({ ...newInvoiceData, montantPaye: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-blue-200/60 dark:border-blue-900/60 text-xs">
                    <span className="text-gray-500 font-semibold">{t('total') || 'Total'} :</span>
                    <strong className="text-blue-600 dark:text-blue-400 text-sm font-black">{formatCurrency(newInvoiceData.total)} Ar</strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('initial_invoice_status') || 'Statut initial de la facture'}
                </label>
                <select
                  value={newInvoiceData.status}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                >
                  <option value="En attente">{t('pending') || 'En attente'}</option>
                  <option value="Payée">{t('paid') || 'Payée'}</option>
                  <option value="Partielle">{t('partial') || 'Partiellement payée'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-semibold cursor-pointer transition-colors text-xs sm:text-sm"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !selectedReservationId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('save_invoice') || 'Enregistrer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE PAIEMENT */}
      {paymentModal.isOpen && paymentModal.invoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-white" />
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold">
                    {t('register_payment_title') || 'Enregistrer un Règlement'}
                  </h2>
                  <p className="text-xs text-blue-100 font-normal">
                     {t('register_payment_sub') || 'Enregistrez les montants perçus en caisse'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModal({ isOpen: false, invoice: null })}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitPayment} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2 text-gray-800 dark:text-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase block">{t('invoice_number') || 'Facture N°'} {paymentModal.invoice.id}</span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200 dark:border-gray-700">
                  <span>{t('total_amount_label') || 'Montant Total'} : <strong>{formatCurrency(paymentModal.invoice.total)} Ar</strong></span>
                  <span>{t('already_paid_label') || 'Déjà Payé'} : <strong className="text-emerald-600">{formatCurrency(paymentModal.invoice.montantPaye)} Ar</strong></span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span>{t('required_deposit_label') || 'Caution requise'} : <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(paymentModal.invoice.deposit)} Ar</strong></span>
                </div>
                <div className="text-right pt-0.5 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">{t('remaining_to_pay_label') || 'Reste à payer'} : {formatCurrency(paymentModal.invoice.resteAPayer)} Ar</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('paid_now_amount_label') || 'Montant versé maintenant (Ar)'} </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModal.invoice.resteAPayer}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={t('enter_collected_amount_placeholder') || "Saisissez le montant encaissé..."}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('payment_method_label') || 'Mode de Règlement :'}</label>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-4 text-white-700 dark:bg-black-950/40 dark:text-blue-300 font-bold shadow-xs flex flex-col items-center justify-center gap-2">
                    <img 
                      src="/images.png" 
                      alt="Logo Espèces" 
                      className="w-20 h-20 object-contain bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm"
                    />
                    <span className="text-xs tracking-wide">{t('cash_caisse') || 'Espèces'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ isOpen: false, invoice: null })}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-semibold cursor-pointer transition-colors text-xs sm:text-sm"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={processingPaymentId === paymentModal.invoice.rawId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50 text-xs sm:text-sm"
                >
                  {processingPaymentId === paymentModal.invoice.rawId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {t('validate_payment') || 'Valider le Règlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE VISUALISATION FACTURE A4 */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 px-6 bg-slate-900 text-white flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-wide">
                  {t('invoice_preview_title') || 'Aperçu Facture & Document Officiel A4'}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {selectedInvoice.status !== 'En attente' && (
                  <button
                    onClick={() => setEmailModal({ isOpen: true, invoice: selectedInvoice })}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" /> {t('send_email') || 'Envoyer par e-mail'}
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> {t('print_export_pdf') || 'Imprimer / Exporter PDF'}
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-invoice-sheet" className="p-10 space-y-6 overflow-y-auto bg-white text-gray-900 font-sans text-sm leading-relaxed">
              
              <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
                <div className="space-y-2">
                  <img 
                    src="/logo.png" 
                    alt="AdrWare Consulting Logo" 
                    className="h-16 w-auto object-contain"
                  />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('company_subtitle') || 'Gestion de Location de Véhicules & Prestations de Services'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Antananarivo, Madagascar | adrwarecontact@gmail.com | +261 38 93 346 87
                  </p>
                </div>

                <div className="text-right space-y-1.5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('invoice_header') || 'FACTURE'}</h2>
                  <div className="inline-block bg-slate-100 px-3.5 py-1 rounded-xl font-mono font-bold text-slate-900 border border-slate-300 text-sm">
                    N° {selectedInvoice.id}
                  </div>
                  <p className="text-xs text-gray-600 pt-1">{t('issue_date_label') || "Date d'émission"} : <strong>{selectedInvoice.date}</strong></p>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block mt-1 ${
                      selectedInvoice.status === 'Payée'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedInvoice.status === 'Partielle'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      • {getStatusLabel(selectedInvoice.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('client_info_label') || 'Informations Client'}</h3>
                  <p className="font-bold text-slate-900 text-base">{selectedInvoice.client}</p>
                  <div className="text-xs text-slate-700 space-y-1 pt-1">
                    {selectedInvoice.phone && <p>{t('phone') || 'Téléphone'} : <span className="font-semibold text-slate-900">{selectedInvoice.phone}</span></p>}
                    {selectedInvoice.email && <p>{t('email') || 'E-mail'} : <span className="font-semibold text-slate-900">{selectedInvoice.email}</span></p>}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('payment_details_label') || 'Détails du Règlement'}</h3>
                  <p className="text-xs font-medium text-slate-600">{t('selected_payment_method') || 'Mode de paiement retenu'} :</p>
                  <div className="pt-1">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 inline-flex items-center gap-1.5 shadow-xs">
                      {formatPaymentMode(selectedInvoice.modePaiement)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">{t('services_details_label') || 'Détails des Prestations (Tous les véhicules)'}</h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="p-3.5 w-32 text-center">{t('photo') || 'Photo'}</th>
                        <th className="p-3.5">{t('vehicle_characteristics') || 'Véhicule & Caractéristiques'}</th>
                        <th className="p-3.5 text-center">{t('rental_period') || 'Période de Réservation'}</th>
                        <th className="p-3.5 text-center">{t('duration') || 'Durée'}</th>
                        <th className="p-3.5 text-right">{t('total_rate') || 'Tarif Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {selectedInvoice.itemsList && selectedInvoice.itemsList.length > 0 ? (
                        selectedInvoice.itemsList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 text-center bg-slate-50">
                              <img 
                                src={item.carImage || "/placeholder-car.png"} 
                                alt={item.car} 
                                className="w-28 h-20 object-cover rounded-xl border border-slate-300 mx-auto shadow-sm"
                              />
                            </td>
                            <td className="p-3.5 align-middle">
                              <div className="font-bold text-slate-900 text-base">{item.car}</div>
                              <div className="text-xs text-slate-600 font-mono mt-1 space-y-0.5">
                                <div>{t('category') || 'Catégorie'} : <strong className="text-slate-800">{item.carCategory}</strong></div>
                                <div>{t('registration') || 'Immatriculation'} : <strong className="text-slate-800">{item.carRegistration}</strong></div>
                              </div>
                            </td>
                            <td className="p-3.5 text-center font-semibold text-xs text-slate-700 align-middle">
                              <div>Du : <strong className="text-slate-900 font-mono">{item.startDate || selectedInvoice.startDate || 'N/A'}</strong></div>
                              <div className="mt-1">Au : <strong className="text-slate-900 font-mono">{item.endDate || selectedInvoice.endDate || 'N/A'}</strong></div>
                            </td>
                            <td className="p-3.5 text-center font-bold text-base align-middle">
                              {item.days} {item.days > 1 ? (t('days') || 'jours') : (t('day') || 'jour')}
                            </td>
                            <td className="p-3.5 text-right font-black text-slate-900 text-base align-middle">
                              {formatCurrency(item.total)} Ar
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-3 text-center bg-slate-50">
                            <img 
                              src={selectedInvoice.carImage || "/placeholder-car.png"} 
                              alt={selectedInvoice.car} 
                              className="w-28 h-20 object-cover rounded-xl border border-slate-300 mx-auto shadow-sm"
                            />
                          </td>
                          <td className="p-3.5 align-middle">
                            <div className="font-bold text-slate-900 text-base">{selectedInvoice.car}</div>
                            <div className="text-xs text-slate-600 font-mono mt-1 space-y-0.5">
                              <div>{t('category') || 'Catégorie'} : <strong className="text-slate-800">{selectedInvoice.carCategory}</strong></div>
                              <div>{t('registration') || 'Immatriculation'} : <strong className="text-slate-800">{selectedInvoice.carRegistration}</strong></div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-semibold text-xs text-slate-700 align-middle">
                            <div>Du : <strong className="text-slate-900 font-mono">{selectedInvoice.startDate || 'N/A'}</strong></div>
                            <div className="mt-1">Au : <strong className="text-slate-900 font-mono">{selectedInvoice.endDate || 'N/A'}</strong></div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-base align-middle">
                            {selectedInvoice.days} {selectedInvoice.days > 1 ? (t('days') || 'jours') : (t('day') || 'jour')}
                          </td>
                          <td className="p-3.5 text-right font-black text-slate-900 text-base align-middle">
                            {formatCurrency(selectedInvoice.total)} Ar
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CONDITION : PAS DE QR CODE POUR LA FACTURE COMBINÉE (REMPLACÉ PAR TEXTE DE REMERCIEMENT) */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 gap-4">
                {String(selectedInvoice.rawId).startsWith('GROUP-') || String(selectedInvoice.id).includes('GRP') ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 space-y-1.5 shadow-xs">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      🌟 Merci & Engagement AdrWare
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cher(e) <strong className="text-slate-900">{selectedInvoice.client}</strong>, nous vous remercions vivement d'avoir choisi ADRWARE. Votre confiance est notre plus belle source de motivation pour viser l'excellence au quotidien. Que chaque kilomètre parcouru avec nous vous rapproche de vos ambitions et de vos plus beaux projets. Excellente route !
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${getBaseUrl()}/verify?id=${selectedInvoice.rawId}&ref=${selectedInvoice.id}`)}`}
                      alt="QR Code Verification"
                      className="w-20 h-20 border-2 border-cyan-600 p-1 rounded-2xl bg-white shadow-xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-cyan-600" /> {t('digital_authentication') || 'Authentification Numérique'}
                      </span>
                      <span className="text-xs text-slate-500 block max-w-[240px] mt-1 leading-relaxed">
                        {t('qr_scan_notice') || "Scannez pour contrôler la validité de la facture et l'historique des règlements auprès d'AdrWare."}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-200 min-w-[280px] space-y-2 shadow-xs shrink-0">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{t('total_amount_ensemble') || 'Montant Total (Ensemble)'} :</span>
                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(selectedInvoice.total)} Ar</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 font-bold">
                    <span>{t('settled_amount') || 'Montant Réglé'} :</span>
                    <span className="text-sm">{formatCurrency(selectedInvoice.montantPaye)} Ar</span>
                  </div>
                  <div className="flex justify-between text-sm text-rose-600 font-black border-t pt-2 border-slate-200">
                    <span>{t('remaining_to_pay') || 'Reste à Payer'} :</span>
                    <span>{formatCurrency(selectedInvoice.resteAPayer)} Ar</span>
                  </div>
                </div>
              </div>

              <div className="pt-10 grid grid-cols-2 gap-12 text-xs border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-800 mb-12">{t('company_signature_label') || 'Pour AdrWare Consulting (Cachet & Signature) :'}</p>
                  <div className="border-b border-dashed border-slate-400"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-12">{t('client_signature_label') || "Signature du Client (Précédée de 'Bon pour accord') :"}</p>
                  <div className="border-b border-dashed border-slate-400"></div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODALE D'ENVOI D'EMAIL INDIVIDUEL */}
      {emailModal.isOpen && emailModal.invoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>{t('send_invoice_email') || 'Envoyer la Facture par Email'}</span>
              </h2>
              <button
                onClick={() => setEmailModal({ isOpen: false, invoice: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-200 dark:border-gray-700">
              <img 
                src={emailModal.invoice.carImage || "/placeholder-car.png"} 
                alt={emailModal.invoice.car}
                className="w-20 h-14 object-cover rounded-xl border border-gray-300 dark:border-gray-600 shrink-0"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-gray-900 dark:text-gray-100 block">{emailModal.invoice.car}</span>
                <span className="text-gray-500 dark:text-gray-400 block">{t('category') || 'Catégorie'} : {emailModal.invoice.carCategory} • {t('registration') || 'Immat'} : {emailModal.invoice.carRegistration}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold block">{t('invoice') || 'Facture'} : {emailModal.invoice.id}</span>
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('recipient_email') || 'Adresse Email du Destinataire'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  defaultValue={emailModal.invoice.email}
                  placeholder="client@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-xs sm:text-sm transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('email_subject') || 'Objet du message'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  defaultValue={`Votre facture officielle ${emailModal.invoice.id} - Merci pour votre confiance | ADRWARE Car Rental`}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-xs sm:text-sm transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('email_body') || 'Message'}
                </label>
                <textarea
                  rows="8"
                  defaultValue={getEmailDefaultMessage(emailModal.invoice)}
                  className="w-full p-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-xs sm:text-sm transition-all font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button
                  type="button"
                  onClick={() => setEmailModal({ isOpen: false, invoice: null })}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm transition-colors"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:bg-blue-400 text-xs sm:text-sm shadow-xs transition-all"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {isSendingEmail ? (t('sending') || 'Envoi...') : (t('send') || 'Envoyer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE D'ENVOI D'EMAIL EN MASSE */}
      {bulkEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>{t('bulk_emails_title') || "Envoi d'e-mails en masse"} ({selectedInvoiceIds.length})</span>
              </h2>
              <button
                onClick={() => setBulkEmailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBulkEmail} className="space-y-4 text-xs sm:text-sm">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('bulk_email_notice') || 'Vous allez envoyer un e-mail à'} <strong>{selectedInvoiceIds.length}</strong> {t('recipients_selected_label') || 'destinataire(s) sélectionné(s).'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('email_subject') || 'Objet du message'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="bulk-subject"
                  required
                  defaultValue="✨ Votre facture officielle {id} - Merci pour votre confiance | ADRWARE Car Rental"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('custom_message_label') || 'Message personnalisé'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="bulk-message"
                  rows="6"
                  defaultValue={`Bonjour {client},\n\nToute l'équipe d'ADRWARE Car Rental vous adresse ses plus chaleureux remerciements pour votre confiance renouvelée. C'est un réel privilège de vous compter parmi nos clients privilégiés et de vous accompagner dans vos projets de mobilité.\n\nVeuillez trouver ci-joint votre facture officielle mise à jour (Réf: {id}).\n\nNous demeurons à votre entière disposition pour toute information complémentaire et vous souhaitons une route pleine de succès.\n\nBien cordialement,\n**La Direction Commerciale - ADRWARE Car Rental**`}
                  className="w-full p-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                <button
                  type="button"
                  onClick={() => setBulkEmailModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm transition-colors"
                >
                  {t('cancel') || 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingBulkEmail}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:bg-blue-400 text-xs sm:text-sm shadow-xs transition-all"
                >
                  {isSendingBulkEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {isSendingBulkEmail ? (t('sending_in_progress') || 'Envoi en cours...') : (t('send_to_all') || 'Envoyer à tous')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 border border-gray-100 dark:border-gray-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl dark:bg-rose-950/60 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {deleteModal.ids.length > 1 
                    ? `${t('delete_invoices_multiple') || 'Supprimer les factures ?'} (${deleteModal.ids.length})` 
                    : (t('delete_invoice_single') || 'Supprimer la facture ?')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('irreversible_action') || 'Cette action est définitive et irréversible.'}
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
                {t('delete') || 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}