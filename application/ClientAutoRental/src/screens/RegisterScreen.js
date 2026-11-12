import React, { useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Eye, EyeOff, User } from 'lucide-react-native';
import api from '../services/api';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showToast("Permission d'accès à la galerie requise !", 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    // 1. Validation du Nom (minimum 2 caractères)
    if (!cleanLastName || cleanLastName.length < 2) {
      showToast('Le nom de famille doit contenir au moins 2 caractères.', 'error');
      return;
    }

    // 2. Validation de l'Email en minuscules
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      showToast("Veuillez saisir une adresse email valide en minuscules.", 'error');
      return;
    }

    // 3. Validation du Numéro (exactement 10 chiffres)
    const phoneRegex = /^\d{10}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      showToast('Le numéro de téléphone doit comporter exactement 10 chiffres.', 'error');
      return;
    }

    // 4. Validation de l'adresse physique
    if (!cleanAddress) {
      showToast('Veuillez saisir votre adresse physique.', 'error');
      return;
    }

    // 5. Validation du Mot de passe (8 caractères min, 1 maj, 1 min, 1 caractère spécial)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+~=`[\]\\/]).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      showToast('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un caractère spécial.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', cleanLastName);
      formData.append('email', cleanEmail);
      formData.append('phone', cleanPhone);
      formData.append('phone_number', cleanPhone);
      formData.append('address', cleanAddress);
      formData.append('password', password);
      formData.append('is_admin', 'false');

      if (profileImage) {
        const uriParts = profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('profile_picture', {
          uri: profileImage,
          name: `profile_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await api.post('accounts/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201 || response.status === 200) {
        showToast('Compte créé ! Redirection...', 'success');
        setTimeout(() => {
          navigation.navigate('VerifyOTP', { email: cleanEmail });
        }, 1500);
      }
    } catch (error) {
      console.log("Erreur détail inscription :", error.response?.data || error.message);
      let serverMsg = 'Une erreur est survenue lors de l’inscription.';

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          serverMsg = data;
        } else if (data.detail) {
          serverMsg = data.detail;
        } else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const val = data[firstKey];
            const message = Array.isArray(val) ? val.join(' ') : String(val);
            serverMsg = `${firstKey.toUpperCase()} : ${message}`;
          }
        }
      } else if (error.message) {
        serverMsg = "Impossible de contacter le serveur. Vérifiez votre connexion.";
      }

      showToast(serverMsg, 'error');
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
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
          </View>
          <Text style={styles.brandTitle}>Adrware</Text>
          <Text style={styles.slogan}>L'innovation à votre portée</Text>
        </View>

        <Text style={styles.title}>Créer un compte</Text>

        <TouchableOpacity style={styles.avatarPickerContainer} onPress={pickImage} activeOpacity={0.8}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={26} color="#60a5fa" />
              <View style={styles.cameraBadge}>
                <Camera size={10} color="#ffffff" />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Prénom "
          placeholderTextColor="#94a3b8"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom de famille "
          placeholderTextColor="#94a3b8"
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={styles.input}
          placeholder="Adresse Email "
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={(text) => setEmail(text.toLowerCase())}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          placeholderTextColor="#94a3b8"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <TextInput
          style={styles.input}
          placeholder="Adresse physique"
          placeholderTextColor="#94a3b8"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe "
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.btnText}>{loading ? 'Création...' : "S'inscrire"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
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
  brandContainer: { alignItems: 'center', marginBottom: isSmallDevice ? 10 : 16 },
  logoContainer: { 
    width: isSmallDevice ? 65 : 75, 
    height: isSmallDevice ? 65 : 75, 
    borderRadius: isSmallDevice ? 32.5 : 37.5, 
    overflow: 'hidden', 
    marginBottom: 6, 
    backgroundColor: '#1e293b' 
  },
  logoImage: { width: '100%', height: '100%' },
  brandTitle: { fontSize: isSmallDevice ? 20 : 23, fontWeight: 'bold', color: '#ffffff', letterSpacing: 0.5 },
  slogan: { fontSize: isSmallDevice ? 9 : 10, color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 },
  title: { fontSize: isSmallDevice ? 16 : 18, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center', marginBottom: isSmallDevice ? 10 : 16 },
  
  avatarPickerContainer: {
    alignSelf: 'center',
    width: isSmallDevice ? 72 : 80,
    height: isSmallDevice ? 72 : 80,
    borderRadius: isSmallDevice ? 36 : 40,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 12 : 16,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2563eb',
    padding: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0f172a',
  },

  input: { backgroundColor: '#1e293b', color: '#fff', padding: isSmallDevice ? 11 : 13, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: isSmallDevice ? 10 : 12, fontSize: 14 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: isSmallDevice ? 12 : 16,
  },
  passwordInput: { flex: 1, color: '#fff', padding: isSmallDevice ? 11 : 13, fontSize: 14 },
  eyeIcon: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },

  btnPrimary: { backgroundColor: '#2563eb', padding: isSmallDevice ? 14 : 16, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  linkText: { color: '#60a5fa', textAlign: 'center', marginTop: isSmallDevice ? 14 : 18, fontSize: 13, fontWeight: '500' }
});