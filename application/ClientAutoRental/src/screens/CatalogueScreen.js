import React, { useEffect, useState, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Pressable,
  StyleSheet, 
  Animated, 
  StatusBar, 
  TextInput, 
  ScrollView, 
  Modal,
  RefreshControl,
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DynamicPromoBanner = ({ cars, clientTier, clientDiscount, theme, pulseAnim, t }) => {
  const [promoMessage, setPromoMessage] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const carsInPromo = cars.filter(c => (c.discount > 0) || (c.remise > 0) || (c.discount_percent > 0));

    const switchNotification = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        const hasCarPromos = carsInPromo.length > 0;
        const choice = hasCarPromos ? Math.floor(Math.random() * 2) : 1;

        if (choice === 0) {
          const randomCar = carsInPromo[Math.floor(Math.random() * carsInPromo.length)];
          const carName = `${randomCar.brand || randomCar.marque || ''} ${randomCar.model || randomCar.modele || randomCar.name || ''}`.trim();
          const discountVal = randomCar.discount || randomCar.remise || randomCar.discount_percent || 0;

          setPromoMessage({
            type: 'CAR',
            badge: `PROMO -${discountVal}%`,
            badgeBg: '#ef4444',
            title: `🔥 ${t.carOffer || 'OFFRE VÉHICULE'} : ${carName.toUpperCase()}`,
            subText: `${t.carOfferDesc || "Profitez d'une remise exclusive de"} -${discountVal}% ${t.on || 'sur la'} ${carName} !`
          });
        } else {
          let subMsg = t.loyaltySubDefault || "Cumulez vos réservations pour débloquer des réductions automatiques !";
          if (clientDiscount > 0) {
            subMsg = `${t.memberBenefit || 'En tant que membre'} ${clientTier}, ${t.memberBenefitDesc || 'vous bénéficiez de'} -${clientDiscount}% ${t.onAllRentals || 'sur toutes vos réservations'} !`;
          }

          setPromoMessage({
            type: 'CLIENT',
            badge: clientTier !== 'Standard' ? `${t.status || 'STATUT'} : ${clientTier.toUpperCase()}` : (t.loyaltyProgram || 'PROGRAMME FIDÉLITÉ'),
            badgeBg: theme.accent || '#3b82f6',
            title: `👑 ${t.privilegeAdvantage || 'VOTRE AVANTAGE PRIVILÈGE'} (${clientTier})`,
            subText: subMsg
          });
        }

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    };

    switchNotification();
    const interval = setInterval(() => {
      switchNotification();
    }, 10000);

    return () => clearInterval(interval);
  }, [cars, clientTier, clientDiscount, t]);

  if (!promoMessage) return null;

  return (
    <Animated.View 
      style={[
        styles.promoBox, 
        { 
          backgroundColor: theme.cardBg, 
          borderColor: promoMessage.type === 'CAR' ? '#ef4444' : theme.accent, 
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }] 
        }
      ]}
    >
      <View style={styles.promoHeaderRow}>
        <View style={[styles.promoBadge, { backgroundColor: promoMessage.badgeBg }]}>
          <Text style={[styles.promoBadgeText, { color: '#ffffff' }]}>{promoMessage.badge}</Text>
        </View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: theme.subText }}>{t.autoChange || 'Changement auto (10s)'}</Text>
      </View>
      <Text style={[styles.promoTitle, { color: theme.text }]}>{promoMessage.title}</Text>
      <Text style={[styles.promoSub, { color: theme.subText }]}>{promoMessage.subText}</Text>
    </Animated.View>
  );
};

const ZoomableEyeButton = ({ onPress, theme, t }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={styles.eyeButtonWrapper}>
      <Animated.View style={[styles.eyeButton, { backgroundColor: theme.bg, borderColor: theme.accent, transform: [{ scale: scaleAnim }] }]}>
        <Text style={[styles.eyeIcon, { color: theme.accent }]}>{t.seeDescription || 'Détails'}</Text>
      </Animated.View>
    </Pressable>
  );
};

const AnimatedCard = ({ item, clientDiscount, onSelectModal, onReserve, theme, t }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  const photosArray = item.photos && item.photos.length > 0 ? item.photos : null;
  const imageUrl = item.image || item.photo || (photosArray && photosArray[0]) || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

  const rawStatus = (item.status || '').toLowerCase();
  let carStatus = t.availableStatus || 'Disponible';
  let statusColor = '#10b981';

  if (rawStatus.includes('location') || rawStatus.includes('loué') || rawStatus.includes('rented')) {
    carStatus = t.rentedStatus || 'En location';
    statusColor = '#3b82f6';
  } else if (rawStatus.includes('maint') || rawStatus.includes('indispo') || item.is_available === false) {
    carStatus = t.unavailableStatus || 'Indisponible';
    statusColor = '#ef4444';
  }

  const basePrice = Number(item.price_per_day ?? item.prix_journalier ?? item.price ?? item.prix ?? 0);
  const carDiscount = Number(item.discount || item.remise || 0);
  const totalDiscountPercentage = carDiscount + clientDiscount;

  const finalPrice = basePrice - (basePrice * (totalDiscountPercentage / 100));

  const formatTransmission = (val) => {
    if (!val) return t.automatic || 'Automatique';
    const s = String(val).toLowerCase();
    if (s.includes('man') || s.includes('tànana')) return t.manual || 'Manuelle';
    return t.automatic || 'Automatique';
  };

  const formatFuel = (val) => {
    if (!val) return t.gasoline || 'Essence';
    const s = String(val).toLowerCase();
    if (s.includes('die') || s.includes('gazole')) return t.diesel || 'Diesel';
    return t.gasoline || 'Essence';
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ width: '100%' }}>
      <Animated.View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.carImage} resizeMode="cover" />
          
          <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {carStatus}
            </Text>
          </View>

          {totalDiscountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{totalDiscountPercentage}% PROMO</Text>
            </View>
          )}

          {/* Badge Pro Multi-Photos */}
          {photosArray && photosArray.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountIcon}>📷</Text>
              <Text style={styles.photoCountBadgeText}>1/{photosArray.length}</Text>
            </View>
          )}

          <ZoomableEyeButton onPress={() => onSelectModal(item)} theme={theme} t={t} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.carBrand, { color: theme.text }]}>{item.brand || item.marque || ''}</Text>
            <Text style={[styles.carModel, { color: theme.accent }]}>{item.model || item.modele || item.name || ''}</Text>
          </View>

          <View style={styles.badgeGroup}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[styles.categoryBadgeText, { color: theme.accent }]}>{item.category || item.type || 'SUV'}</Text>
            </View>
            <View style={[styles.subBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[styles.subBadgeText, { color: theme.subText }]}>{formatTransmission(item.transmission)}</Text>
            </View>
            <View style={[styles.subBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[styles.subBadgeText, { color: theme.subText }]}>{formatFuel(item.fuel)}</Text>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: theme.subText }]}>{t.rentalRate || 'Tarif journalier'}</Text>
              {totalDiscountPercentage > 0 ? (
                <View>
                  <Text style={styles.oldPrice}>{basePrice.toLocaleString()} {t.currency || 'Ar'}</Text>
                  <Text style={[styles.carPrice, { color: '#10b981' }]}>
                    {finalPrice.toLocaleString()} <Text style={[styles.currency, { color: theme.accent }]}>{t.currency || 'Ar'}</Text>
                  </Text>
                </View>
              ) : (
                <Text style={[styles.carPrice, { color: theme.text }]}>
                  {basePrice.toLocaleString()} <Text style={[styles.currency, { color: theme.accent }]}>{t.currency || 'Ar'}</Text>
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.btnAction, { backgroundColor: theme.accent }]}
              activeOpacity={0.85}
              onPress={() => onReserve({ ...item, finalPrice, totalDiscountPercentage })}
            >
              <Text style={[styles.btnActionText, { color: theme.bg }]}>{t.reserve || 'Réserver'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function CatalogueScreen({ navigation }) {
  const { theme, t, isDarkMode } = useContext(ThemeContext);

  const [cars, setCars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tous'); 
  const [sortOption, setSortOption] = useState('date'); 
  const [selectedCarForModal, setSelectedCarForModal] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [clientDiscount, setClientDiscount] = useState(0);
  const [clientTier, setClientTier] = useState('Standard');

  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const CATEGORIES = [t.all || 'Tous', 'SUV', '4x4', 'Utilitaire', 'Berline', 'Citadine'];
  const STATUS_FILTERS = [
    { label: t.allStatus || 'Tous les états', value: 'Tous' },
    { label: t.availableStatus || 'Disponible', value: 'Disponible' },
    { label: t.rentedStatus || 'En location', value: 'En location' },
    { label: t.maintenanceStatus || 'En maintenance', value: 'En maintenance' },
  ];

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.015, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    fetchCatalogueAndClientData();
  }, []);

  const fetchCatalogueAndClientData = async () => {
    try {
      const cachedUser = await AsyncStorage.getItem('user_data');
      if (cachedUser) {
        calculateClientTier(JSON.parse(cachedUser));
      }

      const profileRes = await api.get('accounts/me/').catch(() => null);
      if (profileRes && profileRes.data) {
        calculateClientTier(profileRes.data);
        await AsyncStorage.setItem('user_data', JSON.stringify(profileRes.data));
      }

      const res = await api.get('cars/');
      const data = res.data;
      setCars(data);
    } catch (error) {
      const mockCars = [
        { 
          id: 1, 
          brand: 'JEEP', 
          model: 'WRANGLER', 
          category: '4x4',
          price_per_day: 120000, 
          discount: 0, 
          status: 'Disponible',
          fuel: 'Essence',
          transmission: 'Manuelle',
          seats: 5,
          image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
        },
        { 
          id: 2, 
          brand: 'JEEP', 
          model: 'RUBICON', 
          category: '4x4',
          price_per_day: 150000, 
          discount: 10,
          status: 'Disponible',
          fuel: 'Diesel',
          transmission: 'Automatique',
          seats: 5,
          image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80'
        }
      ];
      setCars(mockCars);
    }
  };

  const calculateClientTier = (userData) => {
    const rentals = userData.total_rentals || userData.totalRentals || 0;
    const isBanned = userData.is_banned || userData.isBanned;

    if (isBanned) {
      setClientTier('Banni');
      setClientDiscount(0);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCatalogueAndClientData();
    setRefreshing(false);
  };

  const openCarModal = (car) => {
    setSelectedCarForModal(car);
    setActiveSlideIndex(0);
  };

  const filteredCars = cars.filter((car) => {
    const fullTitle = `${car.brand || car.marque || ''} ${car.model || car.modele || car.name || ''}`.toLowerCase();
    const matchesSearch = fullTitle.includes(searchQuery.toLowerCase());
    const carCat = car.category || car.type || 'SUV';
    const matchesCategory = selectedCategory === 'Tous' || selectedCategory === (t.all || 'Tous') || carCat.toLowerCase() === selectedCategory.toLowerCase();
    
    const carStatus = car.status || 'Disponible';
    const matchesStatus = selectedStatusFilter === 'Tous' || carStatus.toLowerCase() === selectedStatusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const currentStatusLabel = STATUS_FILTERS.find(s => s.value === selectedStatusFilter)?.label || (t.status || 'Statut');

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 6 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />
        }
        ListHeaderComponent={
          <>
            <DynamicPromoBanner 
              cars={cars} 
              clientTier={clientTier} 
              clientDiscount={clientDiscount} 
              theme={theme} 
              pulseAnim={pulseAnim}
              t={t} 
            />

            <View style={[styles.searchContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t.searchPlaceholder || "Rechercher par marque ou modèle..."}
                placeholderTextColor={theme.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={[styles.clearIcon, { color: theme.subText }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterControlRow}>
              <View style={[styles.sortContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <TouchableOpacity 
                  style={[styles.sortBtn, sortOption === 'date' && { backgroundColor: theme.accent }]}
                  onPress={() => setSortOption('date')}
                >
                  <Text style={[styles.sortBtnText, { color: sortOption === 'date' ? theme.bg : theme.subText }]}>{t.dateSort || 'Date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortBtn, sortOption === 'alphabetique' && { backgroundColor: theme.accent }]}
                  onPress={() => setSortOption('alphabetique')}
                >
                  <Text style={[styles.sortBtnText, { color: sortOption === 'alphabetique' ? theme.bg : theme.subText }]}>A-Z</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.dropdownTrigger, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => setStatusDropdownVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownTriggerText, { color: theme.text }]} numberOfLines={1}>{currentStatusLabel}</Text>
                <Text style={[styles.dropdownChevron, { color: theme.accent }]}>▾</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40, marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, { backgroundColor: theme.cardBg, borderColor: theme.border }, isActive && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.categoryText, { color: isActive ? theme.bg : theme.subText }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t.generalFleet || 'Parc Automobile Général'}</Text>
              <Text style={[styles.carCount, { color: theme.accent }]}>{filteredCars.length} {t.vehicleCount || 'véhicule(s)'}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <AnimatedCard 
            item={item}
            clientDiscount={clientDiscount}
            onSelectModal={(car) => openCarModal(car)}
            onReserve={(car) => navigation.navigate('Reservation', { car })}
            theme={theme}
            t={t}
          />
        )}
      />

      <Modal visible={statusDropdownVisible} transparent={true} animationType="fade" onRequestClose={() => setStatusDropdownVisible(false)}>
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setStatusDropdownVisible(false)}>
          <View style={[styles.dropdownCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownMenuTitle, { color: theme.text }]}>{t.filterByStatus || 'Filtrer par état'}</Text>
              <TouchableOpacity onPress={() => setStatusDropdownVisible(false)}>
                <Text style={[styles.dropdownClose, { color: theme.subText }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.dropdownDivider, { backgroundColor: theme.border }]} />
            {STATUS_FILTERS.map((st) => (
              <TouchableOpacity key={st.value} style={styles.dropdownItem} onPress={() => { setSelectedStatusFilter(st.value); setStatusDropdownVisible(false); }}>
                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{st.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Fiche Technique avec Slider Galerie d'Images */}
      <Modal 
        visible={selectedCarForModal !== null} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={() => setSelectedCarForModal(null)}
      >
        <View style={styles.proModalOverlay}>
          <View style={[styles.proModalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.proModalHeader}>
              <Text style={[styles.proModalHeaderTitle, { color: theme.text }]}>{t.technicalSheet || 'Fiche Technique'}</Text>
              <TouchableOpacity 
                style={[styles.proCloseBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} 
                onPress={() => setSelectedCarForModal(null)}
              >
                <Text style={[styles.proCloseText, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedCarForModal && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                {/* Conteneur du Slider d'Images */}
                <View style={[styles.proImageContainer, { borderColor: theme.border }]}>
                  {selectedCarForModal.photos && selectedCarForModal.photos.length > 0 ? (
                    <View style={{ width: '100%', height: '100%' }}>
                      <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                          const slideSize = e.nativeEvent.layoutMeasurement.width;
                          const offset = e.nativeEvent.contentOffset.x;
                          const index = Math.round(offset / slideSize);
                          setActiveSlideIndex(index);
                        }}
                        scrollEventThrottle={16}
                      >
                        {selectedCarForModal.photos.map((photoUri, index) => (
                          <View key={index} style={styles.sliderImageWrapper}>
                            <Image 
                              source={{ uri: photoUri }} 
                              style={styles.proCarImage} 
                              resizeMode="cover" 
                            />
                          </View>
                        ))}
                      </ScrollView>
                      
                      {/* Badge du compteur de photos */}
                      <View style={styles.sliderPaginationBadge}>
                        <Text style={styles.sliderPaginationText}>
                          {activeSlideIndex + 1} / {selectedCarForModal.photos.length}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: selectedCarForModal.image || selectedCarForModal.photo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80' }} 
                      style={styles.proCarImage} 
                      resizeMode="cover" 
                    />
                  )}
                </View>

                <View style={styles.proTitleSection}>
                  <Text style={[styles.proBrandText, { color: theme.subText }]}>
                    {selectedCarForModal.brand || selectedCarForModal.marque || ''}
                  </Text>
                  <Text style={[styles.proModelText, { color: theme.text }]}>
                    {selectedCarForModal.model || selectedCarForModal.modele || selectedCarForModal.name || (t.vehicle || 'Véhicule')}
                  </Text>
                  <Text style={[styles.proPriceText, { color: theme.accent }]}>
                    {(selectedCarForModal.price_per_day ?? selectedCarForModal.prix_journalier ?? selectedCarForModal.price ?? 0).toLocaleString()} {t.currency || 'Ar'} <Text style={{ fontSize: 12, color: theme.subText, fontWeight: 'normal' }}>/ {t.day || 'jour'}</Text>
                  </Text>
                </View>

                <View style={[styles.proSpecsList, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                  <View style={[styles.proSpecRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.proSpecLabel, { color: theme.subText }]}>{t.status || 'Statut'}</Text>
                    <Text style={[styles.proSpecValue, { color: selectedCarForModal.status === 'Disponible' ? '#10b981' : '#f59e0b' }]}>
                      {selectedCarForModal.status === 'Disponible' ? (t.availableStatus || 'Disponible') : (t.unavailableStatus || 'Indisponible')}
                    </Text>
                  </View>

                  <View style={[styles.proSpecRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.proSpecLabel, { color: theme.subText }]}>{t.category || 'Catégorie'}</Text>
                    <Text style={[styles.proSpecValue, { color: theme.text }]}>
                      {selectedCarForModal.category || selectedCarForModal.type || 'SUV'}
                    </Text>
                  </View>

                  <View style={[styles.proSpecRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.proSpecLabel, { color: theme.subText }]}>{t.transmission || 'Transmission'}</Text>
                    <Text style={[styles.proSpecValue, { color: theme.text }]}>
                      {selectedCarForModal.transmission?.toLowerCase().includes('man') ? (t.manual || 'Manuelle') : (t.automatic || 'Automatique')}
                    </Text>
                  </View>

                  <View style={[styles.proSpecRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.proSpecLabel, { color: theme.subText }]}>{t.fuel || 'Carburant'}</Text>
                    <Text style={[styles.proSpecValue, { color: theme.text }]}>
                      {selectedCarForModal.fuel?.toLowerCase().includes('die') ? (t.diesel || 'Diesel') : (t.gasoline || 'Essence')}
                    </Text>
                  </View>

                  <View style={[styles.proSpecRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.proSpecLabel, { color: theme.subText }]}>{t.doorsAndSeats || 'Portes / Places'}</Text>
                    <Text style={[styles.proSpecValue, { color: theme.text }]}>
                      {selectedCarForModal.doors || '4'} {t.doors || 'portes'} | {selectedCarForModal.seats || '5'} {t.seats || 'places'}
                    </Text>
                  </View>

                  <View style={[styles.proSpecRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.proSpecLabel, { color: theme.subText }]}>{t.mileage || 'Kilométrage'}</Text>
                    <Text style={[styles.proSpecValue, { color: theme.text }]}>
                      {selectedCarForModal.mileage ? `${selectedCarForModal.mileage} km` : (t.unlimited || 'Illimité')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.proReserveBtn, { backgroundColor: theme.accent }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const carToRes = selectedCarForModal;
                    setSelectedCarForModal(null);
                    navigation.navigate('Reservation', { car: carToRes });
                  }}
                >
                  <Text style={[styles.proReserveBtnText, { color: theme.bg }]}>{t.reserveThisCar || 'Réserver ce véhicule'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  promoBox: { padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1.5 },
  promoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  promoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  promoBadgeText: { fontWeight: '800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8 },
  promoTitle: { fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },
  promoSub: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, height: 42, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13 },
  clearIcon: { fontSize: 14, paddingHorizontal: 4 },
  filterControlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, height: 38 },
  sortContainer: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 2 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sortBtnText: { fontSize: 11, fontWeight: '600' },
  dropdownTrigger: { flex: 1, marginLeft: 10, height: 38, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  dropdownTriggerText: { fontSize: 11, fontWeight: '600' },
  dropdownChevron: { fontSize: 13, fontWeight: 'bold' },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dropdownCard: { width: '80%', maxWidth: 300, borderRadius: 14, borderWidth: 1, paddingVertical: 6 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  dropdownMenuTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  dropdownClose: { fontSize: 14, fontWeight: '700' },
  dropdownDivider: { height: 1, width: '100%', marginBottom: 4 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemText: { fontSize: 13 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6, borderWidth: 1, justifyContent: 'center' },
  categoryText: { fontSize: 11, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  carCount: { fontSize: 11, fontWeight: '600' },
  card: { borderRadius: 12, marginBottom: 14, overflow: 'hidden', borderWidth: 1 },
  imageContainer: { width: '100%', height: 210, position: 'relative' },
  carImage: { width: '100%', height: '100%' },
  statusBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  
  /* Nouveau design Pro pour le badge photo */
  photoCountBadge: { 
    position: 'absolute', 
    top: 38, 
    left: 10, 
    backgroundColor: 'rgba(15, 23, 42, 0.75)', 
    paddingHorizontal: 7, 
    paddingVertical: 4, 
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  photoCountIcon: {
    fontSize: 10,
  },
  photoCountBadgeText: { 
    color: '#ffffff', 
    fontSize: 10, 
    fontWeight: '700',
    letterSpacing: 0.3
  },

  eyeButtonWrapper: { position: 'absolute', bottom: 10, left: 10 },
  eyeButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  eyeIcon: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardContent: { padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  carBrand: { fontSize: 15, fontWeight: '700', marginRight: 6 },
  carModel: { fontSize: 15, fontWeight: '600' },
  badgeGroup: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  categoryBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  subBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  subBadgeText: { fontSize: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  priceContainer: { flexDirection: 'column' },
  priceLabel: { fontSize: 8, textTransform: 'uppercase', fontWeight: '600' },
  oldPrice: { fontSize: 11, textDecorationLine: 'line-through', color: '#94a3b8' },
  carPrice: { fontSize: 15, fontWeight: '800' },
  currency: { fontSize: 10, fontWeight: '600' },
  btnAction: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnActionText: { fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },

  proModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  proModalContainer: { width: '100%', maxWidth: 380, maxHeight: '90%', borderRadius: 20, borderWidth: 1, overflow: 'hidden', elevation: 10 },
  proModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  proModalHeaderTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  proCloseBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  proCloseText: { fontSize: 14, fontWeight: 'bold' },
  proImageContainer: { width: '100%', height: 200, borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginVertical: 14, backgroundColor: '#000', position: 'relative' },
  sliderImageWrapper: { width: 338, height: '100%' },
  proCarImage: { width: '100%', height: '100%' },
  sliderPaginationBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sliderPaginationText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  proTitleSection: { alignItems: 'center', marginBottom: 14 },
  proBrandText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  proModelText: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  proPriceText: { fontSize: 17, fontWeight: '800' },
  proSpecsList: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  proSpecRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: 1 },
  proSpecLabel: { fontSize: 13, fontWeight: '500' },
  proSpecValue: { fontSize: 13, fontWeight: '700' },
  proReserveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  proReserveBtnText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }
});