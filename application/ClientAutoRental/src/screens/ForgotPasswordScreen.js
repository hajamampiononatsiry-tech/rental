import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import api from '../services/api';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Veuillez saisir votre adresse e-mail.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('accounts/password_reset/', { 
        email: cleanEmail,
        is_web: false 
      });
      
      showToast('Code envoyé avec succès par e-mail.', 'success');
      setTimeout(() => {
        navigation.navigate('ResetPasswordMobile');
      }, 1500);
    } catch (error) {
      console.log('Erreur réinitialisation :', error.response?.data);
      const msg = error.response?.data?.detail || 'Une erreur est survenue. Veuillez réessayer.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#94a3b8" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>
          Entrez votre adresse e-mail pour recevoir votre code de réinitialisation.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Votre adresse e-mail"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleResetPassword} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnText}>{loading ? 'Envoi en cours...' : 'Envoyer le code'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: width * 0.06, justifyContent: 'center', backgroundColor: '#0f172a' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#94a3b8', fontSize: 15, marginLeft: 8, fontWeight: '500' },
  title: { fontSize: isSmallDevice ? 22 : 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  subtitle: { fontSize: isSmallDevice ? 14 : 15, color: '#94a3b8', marginBottom: 20, lineHeight: 20 }, // Corrigé ici
  input: { backgroundColor: '#1e293b', color: '#fff', padding: isSmallDevice ? 12 : 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 16, fontSize: 15 },
  btnPrimary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});