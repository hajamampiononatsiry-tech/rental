import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Toast from '../components/Toast';
import { parseBackendError } from '../utils/errorHandler';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function ReservationScreen({ route, navigation }) {
  const { theme, t, isDarkMode } = useContext(ThemeContext);

  const [startDate, setStartDate] = useState('');
  const [days, setDays] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const [banError, setBanError] = useState(null);

  const [clientDiscount, setClientDiscount] = useState(0);
  const [clientTier, setClientTier] = useState('Standard');

  const { car } = route.params || {};
  const rawPrice = car?.price_per_day ?? car?.prix_journalier ?? car?.prix ?? car?.price ?? 0;
  const pricePerDay = Number(rawPrice) || 0;

  const rawCarDiscount = car?.discount ?? car?.remise ?? car?.discount_percent ?? 0;
  const carDiscountPercent = Number(rawCarDiscount) || 0;

  useEffect(() => {
    fetchClientLoyaltyDiscount();
  }, []);

  const fetchClientLoyaltyDiscount = async () => {
    try {
      const cachedUser = await AsyncStorage.getItem('user_data');
      let userEmail = '';

      if (cachedUser) {
        const parsedCached = JSON.parse(cachedUser);
        userEmail = parsedCached.email || '';
        if (parsedCached.discountPercent !== undefined || parsedCached.total_rentals !== undefined) {
          applyClientData(parsedCached);
        }
      }

      if (!userEmail) {
        userEmail = 'ainakely811@gmail.com';
      }

      const clientRes = await api.get(`clients/?search=${encodeURIComponent(userEmail)}`).catch(() => null);
      
      if (clientRes && clientRes.data) {
        const clientList = clientRes.data.results || clientRes.data;
        const currentClient = clientList.find(c => c.email.toLowerCase() === userEmail.toLowerCase()) || clientList[0];

        if (currentClient) {
          applyClientData(currentClient);
          await AsyncStorage.setItem('user_data', JSON.stringify({ email: userEmail, ...currentClient }));
          return;
        }
      }

      const profileRes = await api.get(`accounts/me/?email=${encodeURIComponent(userEmail)}`).catch(() => null);
      if (profileRes && profileRes.data) {
        applyClientData(profileRes.data);
      }

    } catch (error) {
      console.error("Erreur générale chargement profil fidélité :", error);
    }
  };

  const applyClientData = (userData) => {
    const rentals = userData.total_rentals || userData.totalRentals || 0;
    const isBanned = userData.is_banned || userData.isBanned;
    const backendDiscount = userData.discountPercent !== undefined ? userData.discountPercent : userData.discount;

    if (isBanned) {
      setClientTier('Banni');
      setClientDiscount(0);
    } else if (backendDiscount !== undefined && backendDiscount > 0) {
      setClientDiscount(Number(backendDiscount));
      if (backendDiscount >= 15) setClientTier('VIP Gold');
      else if (backendDiscount >= 5) setClientTier('VIP Bronze');
    } else if (rentals >= 5) {
      setClientTier('VIP Gold');
      setClientDiscount(15);
    } else if (rentals >= 3) {
      setClientTier('VIP Bronze');
      setClientDiscount(5);
    } else {
      setClientTier('Standard');
      setClientDiscount(0);
    }
  };

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const totalDays = Math.max(1, parseInt(days, 10) || 1);
  const subtotal = totalDays * pricePerDay;
  
  const totalDiscountPercent = Math.min(100, carDiscountPercent + clientDiscount);
  const discountAmount = (subtotal * totalDiscountPercent) / 100;
  const totalPrice = subtotal - discountAmount;

  const formatLocalDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleBooking = async () => {
    setBanError(null);

    if (!startDate) {
      showToast(t.enterStartDate || 'Veuillez saisir la date de début de location.', 'warning');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate.trim())) {
      showToast(t.invalidDateFormat || 'Format de date invalide (Format attendu : AAAA-MM-JJ).', 'error');
      return;
    }

    const start = new Date(startDate.trim() + 'T00:00:00');
    if (isNaN(start.getTime())) {
      showToast(t.invalidDate || 'Date invalide. Vérifiez l\'année, le mois et le jour.', 'error');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      showToast(t.pastDateError || 'La date de réservation ne peut pas être située dans le passé.', 'error');
      return;
    }

    setLoading(true);

    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1);
    
    const startDateFormatted = formatLocalDate(start);
    const endDateFormatted = formatLocalDate(end);

    const payload = {
      car: car?.id,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      total_price: totalPrice,
      notes: notes
    };

    try {
      await api.post('reservations/', payload);

      const newNotif = {
        id: Date.now(),
        title: t.bookingValidated || 'Réservation validée !',
        message: `${t.bookingFor || 'Réservation pour'} ${car?.brand || ''} ${car?.model || ''} ${t.from || 'du'} ${startDateFormatted} ${t.to || 'au'} ${endDateFormatted} (${clientTier} : -${totalDiscountPercent}%).`,
        date: t.today || "Aujourd'hui",
        status: t.pending || 'En attente',
        carName: `${car?.brand || ''} ${car?.model || ''}`,
        totalPrice: totalPrice,
        startDate: startDateFormatted,
        endDate: endDateFormatted
      };

      showToast(t.bookingSuccess || 'Votre réservation a été enregistrée avec succès !', 'success');

      setTimeout(() => {
        navigation.navigate('Notifications', { newNotif });
      }, 1500);

    } catch (error) {
      const friendlyMsg = parseBackendError(error);
      
      if (friendlyMsg.toLowerCase().includes('banni') || friendlyMsg.toLowerCase().includes('motif')) {
        setBanError(friendlyMsg);
      } else {
        showToast(friendlyMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.bg }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {banError && (
          <View style={styles.banAlertCard}>
            <Text style={styles.banAlertTitle}>{t.bannedAccount || 'Compte Banni'} 🚫</Text>
            <Text style={styles.banAlertText}>{banError}</Text>
          </View>
        )}

        <View style={[styles.headerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.badgeLabel, { color: theme.accent }]}>{t.reservationBadge || 'RÉSERVATION'} ({clientTier})</Text>
          <Text style={[styles.carName, { color: theme.text }]}>
            {car?.brand || car?.marque || ''} {car?.model || car?.modele || (t.vehicle || 'Véhicule')}
          </Text>
          <View style={styles.priceContainer}>
            {totalDiscountPercent > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.priceOld}>{pricePerDay.toLocaleString()} {t.currency || 'Ar'}</Text>
                <Text style={styles.priceValue}>
                  {(pricePerDay - (pricePerDay * totalDiscountPercent) / 100).toLocaleString()} {t.currency || 'Ar'}
                </Text>
                <Text style={styles.badgePromo}>-{totalDiscountPercent}%</Text>
              </View>
            ) : (
              <Text style={styles.priceValue}>{pricePerDay.toLocaleString()} {t.currency || 'Ar'}</Text>
            )}
            <Text style={[styles.priceUnit, { color: theme.subText }]}> / {t.day || 'jour'}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.text }]}>{t.startDateLabel || 'Date de début (AAAA-MM-JJ)'}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Ex: 2026-10-15"
            placeholderTextColor={theme.subText}
            value={startDate}
            onChangeText={setStartDate}
          />

          <Text style={[styles.label, { color: theme.text }]}>{t.rentalDaysLabel || 'Nombre de jours de location'}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor={theme.subText}
            value={days}
            onChangeText={setDays}
          />

          <Text style={[styles.label, { color: theme.text }]}>{t.notesLabel || 'Remarques ou demandes particulières'}</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
            placeholder={t.notesPlaceholder || 'Ex: Siège bébé, chauffeur...'}
            placeholderTextColor={theme.subText}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>{t.tariffSummary || 'Détails du tarif & Avantages'}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.subText }]}>{t.selectedDuration || 'Durée sélectionnée'}</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{totalDays} {t.daysUnit || 'Jour(s)'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.subText }]}>{t.subtotal || 'Sous-total'}</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{subtotal.toLocaleString()} {t.currency || 'Ar'}</Text>
          </View>

          {carDiscountPercent > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#ef4444' }]}>Promo véhicule (-{carDiscountPercent}%)</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>- {((subtotal * carDiscountPercent) / 100).toLocaleString()} {t.currency || 'Ar'}</Text>
            </View>
          )}

          {clientDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#f59e0b' }]}>Fidélité {clientTier} (-{clientDiscount}%)</Text>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>- {((subtotal * clientDiscount) / 100).toLocaleString()} {t.currency || 'Ar'}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>{t.estimatedTotal || 'Total estimé'}</Text>
            <Text style={[styles.totalAmountAgence, { color: theme.accent }]}>{totalPrice.toLocaleString()} {t.currency || 'Ar'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.btnSubmit, { backgroundColor: theme.accent }, loading && styles.btnDisabled]} 
          onPress={handleBooking} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.btnText, { color: theme.bg }]}>{t.confirmBooking || 'Confirmer la réservation'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: width * 0.04, paddingBottom: 110 },
  banAlertCard: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 16, padding: 14, marginBottom: 16 },
  banAlertTitle: { color: '#f87171', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  banAlertText: { color: '#fca5a5', fontSize: 13, lineHeight: 18 },
  headerCard: { borderRadius: 16, padding: isSmallDevice ? 14 : 18, marginBottom: 16, borderWidth: 1 },
  badgeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' },
  carName: { fontSize: isSmallDevice ? 18 : 20, fontWeight: 'bold', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  priceOld: { fontSize: 13, color: '#94a3b8', textDecorationLine: 'line-through' },
  priceValue: { fontSize: isSmallDevice ? 17 : 19, fontWeight: 'bold', color: '#10b981' },
  badgePromo: { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  priceUnit: { fontSize: 12, marginLeft: 4 },
  formSection: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: isSmallDevice ? 11 : 13, fontSize: 14, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  summaryCard: { padding: isSmallDevice ? 14 : 16, borderRadius: 16, borderWidth: 1, marginVertical: 10 },
  summaryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontWeight: '600', fontSize: 13 },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 14, fontWeight: 'bold' },
  totalAmountAgence: { fontSize: isSmallDevice ? 17 : 19, fontWeight: 'bold' },
  btnSubmit: { padding: isSmallDevice ? 14 : 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 15, fontWeight: 'bold' }
});