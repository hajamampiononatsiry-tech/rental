import React, { useEffect, useState, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme, t, isDarkMode } = useContext(ThemeContext);

  const [userReservations, setUserReservations] = useState([]);
  const [topCars, setTopCars] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clientName, setClientName] = useState('Utilisateur');
  const [clientAvatar, setClientAvatar] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.85)).current;

  const scrollX = useRef(new Animated.Value(0)).current;
  const carrouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
        ]),
      ])
    ).start();

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (topCars.length === 0) return;
    const carrouselInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % topCars.length;
        if (carrouselRef.current) {
          carrouselRef.current.scrollTo({ x: nextIndex * (width - 64), animated: true });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(carrouselInterval);
  }, [topCars]);

  const fetchHomeData = async () => {
    try {
      const cachedUser = await AsyncStorage.getItem('user_data');
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        const fullName = `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim() || parsed.username;
        if (fullName) setClientName(fullName);
        if (parsed.profile_picture) setClientAvatar(parsed.profile_picture);
      }

      const [profileRes, resRes, carsRes] = await Promise.all([
        api.get('accounts/me/').catch(() => null),
        api.get('reservations/').catch(() => ({ data: [] })),
        api.get('cars/').catch(() => ({ data: [] }))
      ]);

      if (profileRes && profileRes.data) {
        const userData = profileRes.data;
        const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Utilisateur';
        
        setClientName(fullName);
        if (userData.profile_picture) {
          setClientAvatar(userData.profile_picture);
        }
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      }

      const resData = resRes.data.results || resRes.data;
      if (Array.isArray(resData)) {
        setUserReservations(resData.slice(0, 2));
      }

      const carsData = carsRes.data.results || carsRes.data;
      if (Array.isArray(carsData)) {
        setTopCars(carsData.slice(0, 3));
      }
    } catch (error) {
      console.log("Erreur chargement accueil :", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  const getCarImage = (car) => {
    return car?.image || car?.photo || (car?.photos && car?.photos[0]) || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  };

  const formatReservationStatus = (status) => {
    if (!status) return t.confirmed || 'Confirmée';
    
    const s = String(status)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (s.includes('confirm') || s.includes('valide') || s.includes('voamarina')) {
      return t.confirmed || 'Confirmée';
    }
    if (s.includes('pend') || s.includes('attent') || s.includes('miandry')) {
      return t.pending || 'En attente';
    }
    if (s.includes('annul') || s.includes('cancel') || s.includes('nofoanana')) {
      return t.cancelled || 'Annulée';
    }
    
    return status;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
      // paddingBottom augmenté à 110 pour éviter que la barre de navigation ne cache les éléments du bas
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 110 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <View style={styles.headerSection}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeSub, { color: theme.subText }]}>
            {t.clientSpace || 'ESPACE CLIENT PRIVILÈGE'}
          </Text>
          <Text style={[styles.welcomeTitle, { color: theme.text }]} numberOfLines={1}>
            {t.welcomeBack || 'Ravi de vous revoir'}, {clientName}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.profileAvatarButton, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          {clientAvatar ? (
            <Image source={{ uri: clientAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitials, { color: theme.accent }]}>
              {clientName.charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={[styles.logoContainer, { backgroundColor: '#ffffff', borderColor: theme.accent }]}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        <Text style={[styles.companyTitle, { color: theme.accent }]}>
          ADRWARE AUTORENTAL
        </Text>
        
        <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: opacityAnim, width: '100%', alignItems: 'center' }}>
          <Text style={[styles.heroTitle, { color: theme.accent }]}>
            {t.heroSlogan || 'Dominez la route avec distinction, confort et sérénité absolue.'}
          </Text>
        </Animated.View>

        <View style={[styles.titleSeparator, { backgroundColor: theme.accent }]} />

        <Text style={[styles.heroDesc, { color: theme.subText }]}>
          {t.heroDesc || "Chaque voyage est une promesse d’évasion. Notre flotte d'exception se tient prête à transformer vos déplacements en une expérience de conduite inoubliable."}
        </Text>
      </View>

      {topCars.length > 0 && (
        <View style={styles.carrouselSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t.topReserved || '🔥 Les 3 Plus Réservés'}
            </Text>
            <Text style={{ fontSize: 10, color: theme.accent, fontWeight: '700', textTransform: 'uppercase' }}>
              {t.favorite || 'Coup de cœur'}
            </Text>
          </View>

          <ScrollView 
            ref={carrouselRef}
            horizontal 
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carrouselContainer}
          >
            {topCars.map((car, index) => {
              const carName = `${car.brand || car.marque || ''} ${car.model || car.modele || car.name || ''}`.trim();
              const price = car.price_per_day ?? car.prix_journalier ?? car.price ?? car.prix ?? 0;

              return (
                <TouchableOpacity 
                  key={`top-car-${car.id || index}`} 
                  style={[styles.carrouselCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Catalogue')}
                >
                  <View style={styles.carrouselTopContent}>
                    <View style={styles.carrouselBadge}>
                      <Text style={styles.carrouselBadgeText}>TOP #{index + 1}</Text>
                    </View>
                    <View style={styles.carrouselTextWrapper}>
                      <Text style={[styles.carrouselTitle, { color: theme.text }]} numberOfLines={1}>{carName}</Text>
                      <Text style={[styles.carrouselPrice, { color: theme.accent }]}>
                        {Number(price).toLocaleString()} {t.currency || 'Ar'} <Text style={{ fontSize: 10, color: theme.subText }}>/ {t.day || 'jour'}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.carrouselImageWrapper}>
                    <Image source={{ uri: getCarImage(car) }} style={styles.carrouselImage} resizeMode="cover" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.paginationDots}>
            {topCars.map((_, i) => (
              <View 
                key={`dot-${i}`} 
                style={[
                  styles.dot, 
                  { backgroundColor: currentIndex === i ? theme.accent : theme.border }
                ]} 
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomSectionWrapper}>
        <View style={styles.commitmentsGrid}>
          <View style={[styles.commitmentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.commitmentTitle, { color: theme.accent }]}>{t.prestigeTitle || 'PRESTIGE & CONFORT'}</Text>
            <Text style={[styles.commitmentText, { color: theme.subText }]}>{t.prestigeDesc || 'Véhicules récents, haut de gamme et contrôlés.'}</Text>
          </View>
          <View style={[styles.commitmentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.commitmentTitle, { color: theme.accent }]}>{t.supportTitle || 'SUPPORT VIP 24/7'}</Text>
            <Text style={[styles.commitmentText, { color: theme.subText }]}>{t.supportDesc || 'Une assistance dédiée à chaque étape de votre route.'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t.activeReservations || 'Vos Réservations Actives'}
          </Text>
        </View>

        {userReservations.length > 0 ? (
          userReservations.map((item) => (
            <View key={item.id} style={[styles.reservationCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.resTopRow}>
                <Text style={[styles.resId, { color: theme.accent }]}>{t.contract || 'Contrat'} #{item.id}</Text>
                <Text style={[styles.resStatus, { color: '#10b981' }]}>{formatReservationStatus(item.status || item.statut)}</Text>
              </View>
              <Text style={[styles.resCarName, { color: theme.text }]}>
                {item.car_name || item.car || item.vehicule || (t.reservedCar || 'Véhicule réservé')}
              </Text>
              <Text style={[styles.resDates, { color: theme.subText }]}>
                {t.period || 'Période'} : {t.from || 'Du'} {item.start_date || item.date_debut} {t.to || 'au'} {item.end_date || item.date_fin}
              </Text>
            </View>
          ))
        ) : (
          <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              {t.noActiveReservation || "Aucune réservation active en cours. Explorez notre catalogue pour planifier votre prochain départ."}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  welcomeSub: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 },
  welcomeTitle: { fontSize: 18, fontWeight: '800', marginTop: 2, letterSpacing: 0.2 },
  profileAvatarButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 18, fontWeight: '800' },
  heroCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  logoContainer: { width: 95, height: 95, borderRadius: 47.5, borderWidth: 1.5, padding: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 14, overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  companyTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  heroTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', letterSpacing: 0.4, lineHeight: 23 },
  titleSeparator: { width: 40, height: 2, borderRadius: 1, marginVertical: 12 },
  heroDesc: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 8, paddingHorizontal: 6 },
  carrouselSection: { marginBottom: 16 },
  carrouselContainer: { paddingRight: 16 },
  carrouselCard: { width: width - 32, borderRadius: 16, borderWidth: 1, overflow: 'hidden', paddingBottom: 12 },
  carrouselTopContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  carrouselBadge: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  carrouselBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  carrouselTextWrapper: { alignItems: 'flex-end', flex: 1, marginLeft: 10 },
  carrouselTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  carrouselPrice: { fontSize: 13, fontWeight: '700' },
  carrouselImageWrapper: { width: '100%', height: 210, overflow: 'hidden' },
  carrouselImage: { width: '100%', height: '100%' },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  bottomSectionWrapper: { marginTop: 4, marginBottom: 10 },
  commitmentsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  commitmentCard: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
  commitmentTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  commitmentText: { fontSize: 10, lineHeight: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  reservationCard: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  resTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  resId: { fontSize: 11, fontWeight: '700' },
  resStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  resCarName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  resDates: { fontSize: 11 },
  emptyBox: { padding: 16, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 10 },
  emptyText: { fontSize: 11, fontStyle: 'italic', textAlign: 'center' }
});