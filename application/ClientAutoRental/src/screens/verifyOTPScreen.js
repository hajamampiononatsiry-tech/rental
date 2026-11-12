import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function VerifyOTPScreen({ route, navigation }) {
  const emailParam = route.params?.email || '';
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      Alert.alert('Erreur', 'Veuillez saisir votre e-mail et le code OTP reçu.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('accounts/verify-otp/', {
        email: cleanEmail,
        otp: cleanOtp,
      });

      if (response.data?.tokens?.access) {
        await AsyncStorage.setItem('user_token', response.data.tokens.access);
        if (response.data.tokens.refresh) {
          await AsyncStorage.setItem('refresh_token', response.data.tokens.refresh);
        }
        
        Alert.alert('Succès', 'Votre compte a été vérifié avec succès !', [
          { text: 'Accéder au catalogue', onPress: () => navigation.replace('Catalogue') },
        ]);
      } else {
        Alert.alert('Succès', 'Compte vérifié ! Veuillez vous connecter.', [
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error) {
      console.log('Erreur détail OTP :', error.response?.data);
      const serverMsg = error.response?.data?.error 
        || error.response?.data?.detail 
        || 'Code OTP invalide ou expiré.';
      Alert.alert('Erreur de vérification', serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Vérification OTP</Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Code OTP (ex: 123456)"
        placeholderTextColor="#94a3b8"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />

      <TouchableOpacity style={styles.btnPrimary} onPress={handleVerifyOTP} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.btnText}>{loading ? 'Vérification...' : 'Valider le code'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: width * 0.06, justifyContent: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: isSmallDevice ? 20 : 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: isSmallDevice ? 12 : 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 14, fontSize: 15 },
  btnPrimary: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});