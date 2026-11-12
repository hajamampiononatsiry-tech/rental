import React, { useState, useEffect } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Eye, EyeOff } from 'lucide-react-native';
import api from '../services/api';
import Toast from '../components/Toast';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
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

  useEffect(() => {
    const clearStaleToken = async () => {
      try {
        await AsyncStorage.removeItem('user_token');
      } catch (e) {
        console.log('Erreur de nettoyage de token', e);
      }
    };
    clearStaleToken();
  }, []);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      showToast('Veuillez saisir votre identifiant et mot de passe.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('accounts/login/', { 
        username: cleanEmail, 
        password,
        is_web: false 
      });
      
      if (res.data?.access) {
        await AsyncStorage.setItem('user_token', res.data.access);
        if (res.data?.refresh) {
          await AsyncStorage.setItem('refresh_token', res.data.refresh);
        }
        navigation.replace('Catalogue');
      } else {
        showToast('Réponse du serveur invalide (Token manquant).', 'error');
      }
    } catch (error) {
      console.log('Erreur connexion :', error.response?.data);
      const errorData = error.response?.data;
      const msg = errorData?.detail || errorData?.non_field_errors?.[0] || 'Identifiants invalides ou accès non autorisé.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: '#0f172a' }}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="cover"
            />
          </View>
          <Text style={styles.brandTitle}>Adrware</Text>
          <Text style={styles.slogan}>L'innovation à votre portée</Text>
        </View>

        <Text style={styles.subtitle}>Espace Client</Text>

        <TextInput
          style={styles.input}
          placeholder="Email ou Nom d'utilisateur"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#94a3b8" />
            ) : (
              <Eye size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.forgotContainer} 
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Créer un nouveau compte</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    paddingHorizontal: width * 0.06, 
    paddingVertical: 20, 
    justifyContent: 'center', 
    backgroundColor: '#0f172a' 
  },
  brandContainer: { alignItems: 'center', marginBottom: isSmallDevice ? 16 : 24 },
  logoContainer: {
    width: isSmallDevice ? 75 : 90,
    height: isSmallDevice ? 75 : 90,
    borderRadius: isSmallDevice ? 37.5 : 45,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#1e293b',
  },
  logoImage: { width: '100%', height: '100%' },
  brandTitle: { fontSize: isSmallDevice ? 22 : 26, fontWeight: 'bold', color: '#ffffff', letterSpacing: 0.5 },
  slogan: { fontSize: isSmallDevice ? 10 : 12, color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
  subtitle: { fontSize: isSmallDevice ? 14 : 16, color: '#94a3b8', textAlign: 'center', marginBottom: isSmallDevice ? 16 : 24 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: isSmallDevice ? 12 : 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 14, fontSize: 15 },
  
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    padding: isSmallDevice ? 12 : 14,
    fontSize: 15,
  },
  eyeIcon: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },

  btnPrimary: { backgroundColor: '#2563eb', padding: isSmallDevice ? 14 : 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#60a5fa', textAlign: 'center', marginTop: 20, fontSize: 14, fontWeight: '500' }
});