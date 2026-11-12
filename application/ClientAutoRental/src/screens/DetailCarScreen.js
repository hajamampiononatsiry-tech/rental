import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function DetailCarScreen({ route, navigation }) {
  const { car } = route.params || {};

  const rawPrice = car?.price_per_day ?? car?.prix_journalier ?? car?.price ?? car?.prix ?? 0;
  const formattedPrice = (Number(rawPrice) || 0).toLocaleString();

  const mainPhoto = car?.image || car?.photo || car?.image_url || 'https://via.placeholder.com/600x400?text=AutoRental';
  const defaultPhotos = car?.photos && car.photos.length > 0 ? car.photos : [
    mainPhoto,
    'https://via.placeholder.com/600x400?text=Interieur',
    'https://via.placeholder.com/600x400?text=Arriere'
  ];

  const [selectedPhoto, setSelectedPhoto] = useState(defaultPhotos[0]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Image source={{ uri: selectedPhoto }} style={styles.mainImage} resizeMode="cover" />

      {defaultPhotos.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
          {defaultPhotos.map((img, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={() => setSelectedPhoto(img)}
              style={[
                styles.thumbnailWrapper, 
                selectedPhoto === img && styles.selectedThumbnail
              ]}
            >
              <Image source={{ uri: img }} style={styles.thumbnail} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{car?.brand || car?.marque || ''} {car?.model || car?.modele || 'Véhicule'}</Text>
        <Text style={styles.price}>{formattedPrice} Ar / Jour</Text>

        <View style={styles.specGrid}>
          <View style={styles.specBadge}>
            <Text style={styles.specLabel}>Boîte</Text>
            <Text style={styles.specValue}>{car?.transmission || 'Manuelle'}</Text>
          </View>
          <View style={styles.specBadge}>
            <Text style={styles.specLabel}>Carburant</Text>
            <Text style={styles.specValue}>{car?.fuel || car?.fuel_type || 'Diesel'}</Text>
          </View>
          <View style={styles.specBadge}>
            <Text style={styles.specLabel}>Places</Text>
            <Text style={styles.specValue}>{car?.seats || '5'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description du véhicule</Text>
          <Text style={styles.description}>{car?.description || 'Aucune description disponible pour ce véhicule.'}</Text>
        </View>

        <TouchableOpacity 
          style={styles.btnReserve}
          onPress={() => navigation.navigate('Reservation', { car })}
        >
          <Text style={styles.btnText}>Réserver ce véhicule</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  mainImage: { width: width, height: 260 },
  thumbnailContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -30 },
  thumbnailWrapper: { borderRadius: 10, borderWidth: 2, borderColor: '#fff', marginRight: 10, overflow: 'hidden' },
  selectedThumbnail: { borderColor: '#2563eb' },
  thumbnail: { width: 70, height: 55, borderRadius: 8 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  price: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', marginVertical: 6 },
  specGrid: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  specBadge: { flex: 1, backgroundColor: '#e2e8f0', padding: 10, borderRadius: 8, alignItems: 'center' },
  specLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase' },
  specValue: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  description: { fontSize: 14, color: '#64748b', marginTop: 6, lineHeight: 22 },
  btnReserve: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});