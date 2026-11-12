import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import api from '../services/api';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleConfirmReset = async () => {
    if (!token.trim() || !password) {
      showToast('Veuillez remplir tous les champs.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('accounts/password_reset/confirm/', {
        token: token.trim(),
        password: password,
      });
      showToast('Mot de passe réinitialisé avec succès !', 'success');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      console.log('Erreur confirmation :', error.response?.data);
      showToast('Jeton invalide ou expiré.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>
          Entrez le code reçu par e-mail ainsi que votre nouveau mot de passe sécurisé.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Code / Jeton reçu par e-mail"
          placeholderTextColor="#94a3b8"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Nouveau mot de passe"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleConfirmReset} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnText}>{loading ? 'Validation...' : 'Valider le nouveau mot de passe'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: width * 0.06, justifyContent: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: isSmallDevice ? 22 : 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 20 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: isSmallDevice ? 12 : 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 14, fontSize: 15 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  passwordInput: { flex: 1, color: '#fff', padding: isSmallDevice ? 12 : 14, fontSize: 15 },
  eyeIcon: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});