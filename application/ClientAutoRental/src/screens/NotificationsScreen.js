import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function NotificationsScreen({ route, navigation }) {
  const { theme, t, isDarkMode } = useContext(ThemeContext);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('reservations');
  const [factures, setFactures] = useState([]);

  useEffect(() => {
    fetchData(false);

    const interval = setInterval(() => {
      fetchData(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
      const cachedUser = await AsyncStorage.getItem('user_data');
      let userEmail = '';
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        userEmail = parsedUser.email || '';
      }

      const [resResponse, facResponse] = await Promise.all([
        api.get(`reservations/?client_email=${userEmail}`).catch(() => ({ data: [] })),
        api.get(`factures/?client_email=${userEmail}`).catch(() => ({ data: [] }))
      ]);

      const resData = resResponse.data.results || resResponse.data;
      const facData = facResponse.data.results || facResponse.data;

      setHistory(Array.isArray(resData) ? resData : []);
      setFactures(Array.isArray(facData) ? facData : []);
    } catch (error) {
      console.log("Erreur lors du chargement de l'historique :", error);
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
  };

  const formatStatus = (status) => {
    if (!status) return t.confirmed || 'Confirmée';
    
    const s = String(status)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (s.includes('valid') || s.includes('termine') || s.includes('paye') || s.includes('voamarina')) {
      return t.confirmed || 'Confirmée';
    }
    if (s.includes('attent') || s.includes('pend') || s.includes('partiel') || s.includes('miandry')) {
      return t.pending || 'En attente';
    }
    if (s.includes('annul') || s.includes('refus') || s.includes('cancel') || s.includes('nofoanana')) {
      return t.cancelled || 'Annulée';
    }
    
    return status;
  };

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('valid') || s.includes('terminé') || s.includes('payée')) {
      return { bg: '#166534', text: '#4ade80' };
    }
    if (s.includes('attente') || s.includes('partiel')) {
      return { bg: '#854d0e', text: '#fde047' };
    }
    if (s.includes('annul') || s.includes('refus')) {
      return { bg: '#991b1b', text: '#fca5a5' };
    }
    return { bg: '#1e293b', text: '#94a3b8' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.historyAndTracking || 'Historique & Suivi'}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subText }]}>{t.historySubtitle || 'Vos réservations et paiements en temps réel'}</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'reservations' && { backgroundColor: theme.accent }]}
          onPress={() => setActiveTab('reservations')}
        >
          <Text style={[styles.tabText, activeTab === 'reservations' ? { color: '#FFFFFF', fontWeight: 'bold' } : { color: theme.subText }]}>
            {t.reservationsTab || 'Réservations'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'factures' && { backgroundColor: theme.accent }]}
          onPress={() => setActiveTab('factures')}
        >
          <Text style={[styles.tabText, activeTab === 'factures' ? { color: '#FFFFFF', fontWeight: 'bold' } : { color: theme.subText }]}>
            {t.invoicesTab || 'Factures & Paiements'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
      ) : activeTab === 'reservations' ? (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={[styles.emptyText, { color: theme.subText }]}>{t.noReservations || 'Aucune réservation enregistrée.'}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const rawStatus = item.status || item.statut || 'En attente';
            const statusStyle = getStatusColor(rawStatus);
            const carTitle = item.car_name || item.carName || (t.rentalVehicle || 'Véhicule de location');
            const price = item.total_price || item.montant_total || 0;

            return (
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.carName, { color: theme.text }]}>{carTitle}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {formatStatus(rawStatus)}
                    </Text>
                  </View>
                </View>

                {item.startDate && item.endDate && (
                  <View style={styles.dateRow}>
                    <Text style={[styles.dateLabel, { color: theme.subText }]}>📅 {t.period || 'Période'} :</Text>
                    <Text style={[styles.dateValue, { color: theme.accent }]}>{t.from || 'Du'} {item.startDate} {t.to || 'au'} {item.endDate}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={[styles.createdDate, { color: theme.subText }]}>{t.ref || 'Réf'}: {item.id}</Text>
                  {price ? (
                    <Text style={[styles.priceText, { color: '#10b981' }]}>
                      {formatCurrency(price)} <Text style={styles.currency}>{t.currency || 'Ar'}</Text>
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={factures}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={[styles.emptyText, { color: theme.subText }]}>{t.noInvoices || 'Aucune facture enregistrée.'}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const rawStatus = item.statut || 'En attente';
            const statusStyle = getStatusColor(rawStatus);
            const total = parseFloat(item.montant_total || item.total || 0);
            const paye = parseFloat(item.montant_paye || 0);
            const reste = parseFloat(item.reste_a_payer || (total - paye));

            return (
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.carName, { color: theme.text }]}>{item.reference || `${t.invoice || 'Facture'} #${item.id}`}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {formatStatus(rawStatus)}
                    </Text>
                  </View>
                </View>

                <View style={{ marginVertical: 6 }}>
                  <Text style={{ color: theme.subText, fontSize: 12 }}>{t.vehicle || 'Véhicule'} : {item.car_name || (t.rental || 'Location')}</Text>
                  <Text style={{ color: '#16a34a', fontSize: 12, marginTop: 2 }}>• {t.paid || 'Payé'} : {formatCurrency(paye)} {t.currency || 'Ar'}</Text>
                  {reste > 0 && (
                    <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 2 }}>• {t.remainingToPay || 'Reste à payer'} : {formatCurrency(reste)} {t.currency || 'Ar'}</Text>
                  )}
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>{t.mode || 'Mode'} : {item.mode_paiement || (t.notSpecified || 'Non spécifié')}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.createdDate, { color: theme.subText }]}>{item.date_emission || ''}</Text>
                  <Text style={[styles.priceText, { color: theme.accent }]}>
                    {formatCurrency(total)} <Text style={styles.currency}>{t.currency || 'Ar'}</Text>
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: width * 0.04, paddingTop: 10 },
  headerContainer: { marginBottom: 12, marginTop: 6 },
  headerTitle: { fontSize: isSmallDevice ? 20 : 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: isSmallDevice ? 11 : 12, marginTop: 2 },
  tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, borderWidth: 1, marginBottom: 14 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: isSmallDevice ? 12 : 13, fontWeight: '600' },
  card: { borderRadius: 14, padding: isSmallDevice ? 12 : 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  carName: { fontSize: isSmallDevice ? 14 : 16, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  dateLabel: { fontSize: 12 },
  dateValue: { fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  createdDate: { fontSize: 11 },
  priceText: { fontSize: isSmallDevice ? 14 : 16, fontWeight: 'bold' },
  currency: { fontSize: 11 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13 }
});