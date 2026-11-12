import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image,
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Linking 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ThemeContext } from '../context/ThemeContext';
import Toast from '../components/Toast';
import api from '../services/api';

// Composant Vectoriel pour le Profil, les Paramètres et WhatsApp
const ProfileVectorIcon = ({ name, color = '#38bdf8', size = 20 }) => {
  switch (name) {
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <Path d="M12 9v4M12 17h.01" />
        </Svg>
      );
    case 'lightbulb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 18h6M10 22h4M15.09 14.09A5 5 0 1 0 9 9" />
        </Svg>
      );
    case 'whatsapp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="5" />
          <Path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2m-4.22-7.78l1.42-1.42M6.34 17.66l-1.42 1.42" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </Svg>
      );
    case 'globe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </Svg>
      );
    case 'map-pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <Circle cx="12" cy="10" r="3" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function ProfileScreen({ navigation }) {
  const { isDarkMode, toggleTheme, language, changeLanguage, theme, t } = useContext(ThemeContext);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => setToast({ visible: true, message, type });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await api.get('accounts/me/');
      setUser(response.data);
      initForm(response.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
    } catch (error) {
      const cachedUser = await AsyncStorage.getItem('user_data');
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        initForm(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  const initForm = (data) => {
    setProfileForm({
      first_name: data?.first_name || '',
      last_name: data?.last_name || '',
      phone_number: data?.phone_number || data?.phone || '',
      address: data?.address || ''
    });
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showToast('Permission d’accès à la galerie requise !', 'error');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImage = pickerResult.assets[0];
      await handleUploadProfilePicture(selectedImage);
    }
  };

  const handleUploadProfilePicture = async (imageAsset) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      const uriParts = imageAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('profile_picture', {
        uri: imageAsset.uri,
        name: `profile_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      const response = await api.patch('accounts/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(response.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      showToast('Photo de profil mise à jour avec succès !', 'success');
    } catch (error) {
      const errMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'Erreur lors du téléchargement de la photo';
      showToast(errMessage, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        ...profileForm,
        phone_number: profileForm.phone_number
      };
      const response = await api.patch('accounts/me/', payload);
      setUser(response.data);
      initForm(response.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      setIsEditProfileVisible(false);
      showToast(t.profileUpdatedSuccess || 'Profil mis à jour avec succès !', 'success');
    } catch (error) {
      const errMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail || 
        (t.updateError || 'Erreur lors de la mise à jour');
      showToast(errMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const oldPwd = passwordForm.old_password?.trim();
    const newPwd = passwordForm.new_password?.trim();
    const confirmPwd = passwordForm.confirm_password?.trim();

    if (!oldPwd || !newPwd || !confirmPwd) {
      showToast(t.fillAllFields || 'Veuillez remplir tous les champs', 'error');
      return;
    }

    if (newPwd !== confirmPwd) {
      showToast(t.passwordsDontMatch || 'Les nouveaux mots de passe ne correspondent pas', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post('accounts/change-password/', {
        old_password: oldPwd,
        new_password: newPwd,
      });

      showToast(t.passwordUpdatedSuccess || 'Mot de passe mis à jour avec succès !', 'success');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setIsPasswordModalVisible(false);
    } catch (error) {
      const errMessage =
        error.response?.data?.old_password?.[0] ||
        error.response?.data?.new_password?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        (t.passwordError || 'Erreur lors du changement de mot de passe');
      showToast(errMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- OUVERTURE DE WHATSAPP DIRECTEMENT VERS L'APPLICATION OU LE SITE ---
  const handleOpenWhatsApp = () => {
    const phoneNumber = '+261389334687'; // Numéro officiel ADRWARE
    const message = encodeURIComponent("Bonjour ADRWARE AutoRental, je vous contacte depuis l'application mobile.");
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          showToast("Impossible d'ouvrir WhatsApp sur cet appareil.", "error");
        }
      })
      .catch((err) => {
        console.error("Erreur ouverture WhatsApp:", err);
        showToast("Erreur lors de l'ouverture de WhatsApp", "error");
      });
  };

  // --- GESTION DU SUPPORT & SIGNALEMENT DE PANNE / PROPOSITION SÉPARÉS ---
  const handleContactSupport = async (type) => {
    const fullName = `${profileForm.first_name || user?.first_name || ''} ${profileForm.last_name || user?.last_name || ''}`.trim() || 'Client ADRWARE';
    const clientEmail = user?.email || (t.emailNotProvided || 'Email non renseigné');
    const clientPhone = profileForm.phone_number || user?.phone_number || user?.phone || (t.phoneNotProvided || 'Non renseigné');

    let subject = '';
    let body = '';

    if (type === 'panne') {
      // --- CAS 1 : SIGNALEMENT DE PANNE TECHNIQUE (AVEC GÉOLOCALISATION GPS) ---
      let locationText = "Position non spécifiée";
      let mapsUrl = "";

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          showToast("Localisation GPS en cours...", "info");
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const { latitude, longitude } = location.coords;
          mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          locationText = `Latitude: ${latitude}, Longitude: ${longitude}`;
        }
      } catch (e) {
        console.log("Erreur géolocalisation :", e);
      }

      subject = encodeURIComponent(`🚨 [ASSISTANCE URGENTE - SIGNALEMENT DE PANNE TECHNIQUE] | ${fullName}`);
      body = encodeURIComponent(
        `Madame, Monsieur,\n\n` +
        `Je vous contacte suite à une urgence ou une panne technique constatée.\n\n` +
        `--- 👤 COORDONNÉES CLIENT ---\n` +
        `• Nom et Prénom : ${fullName}\n` +
        `• Téléphone : ${clientPhone}\n` +
        `• E-mail : ${clientEmail}\n\n` +
        `--- 📍 GÉOLOCALISATION GPS DE LA PANNE ---\n` +
        `• Coordonnées : ${locationText}\n` +
        (mapsUrl ? `• Lien Google Maps direct : ${mapsUrl}\n\n` : '\n') +
        `--- 🛠️ DESCRIPTION DE LA PANNE ---\n` +
        `[ Veuillez décrire ici les détails de la panne technique, le véhicule concerné et la situation actuelle ]\n\n` +
        `Cordialement,\n${fullName}`
      );

    } else {
      // --- CAS 2 : REMARQUE OU PROPOSITION COMMERCIALE (SANS GÉOLOCALISATION) ---
      subject = encodeURIComponent(`💡 [REMARQUE / PROPOSITION COMMERCIALE] | ${fullName}`);
      body = encodeURIComponent(
        `Madame, Monsieur,\n\n` +
        `Je vous contacte afin de vous faire part d'une remarque ou d'une proposition commerciale concernant vos services.\n\n` +
        `--- 👤 COORDONNÉES CLIENT ---\n` +
        `• Nom et Prénom : ${fullName}\n` +
        `• Téléphone : ${clientPhone}\n` +
        `• E-mail : ${clientEmail}\n\n` +
        `--- 💡 DÉTAILS DE LA PROPOSITION OU DE LA REMARQUE ---\n` +
        `[ Veuillez préciser ici votre remarque, suggestion ou proposition d'amélioration ]\n\n` +
        `Cordialement,\n${fullName}`
      );
    }

    Linking.openURL(`mailto:adrwarecontact@gmail.com?subject=${subject}&body=${body}`).catch(() => 
      showToast(t.mailAppError || "Impossible d'ouvrir l'application de messagerie", "error")
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user_token', 'user_data']);
    navigation.replace('Login');
  };

  const displayPhone = profileForm.phone_number || user?.phone_number || user?.phone;

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(p => ({ ...p, visible: false }))} 
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* EN-TÊTE UTILISATEUR */}
        <View style={[styles.headerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarContainer}>
                {uploadingAvatar ? (
                  <View style={[styles.profileAvatar, styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                    <ActivityIndicator size="small" color={theme.accent} />
                  </View>
                ) : user?.profile_picture ? (
                  <Image source={{ uri: user.profile_picture }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                    <ProfileVectorIcon name="user" color={theme.subText} size={38} />
                  </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: theme.accent }]}>
                  <ProfileVectorIcon name="edit" color="#0f172a" size={12} />
                </View>
              </TouchableOpacity>

              <Text style={[styles.userName, { color: theme.text }]}>
                {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || (t.user || 'Utilisateur')}
              </Text>
              <Text style={[styles.userEmail, { color: theme.subText }]}>{user?.email || (t.emailNotProvided || 'Non renseigné')}</Text>
              
              <View style={styles.infoRow}>
                <ProfileVectorIcon name="phone" color={displayPhone ? theme.accent : theme.subText} size={14} />
                <Text style={[styles.infoDetail, { color: displayPhone ? theme.accent : theme.subText }]}>
                  {displayPhone || (t.phoneNotProvided || 'Téléphone non renseigné')}
                </Text>
              </View>

              {user?.address && (
                <View style={[styles.infoRow, { marginTop: 4 }]}>
                  <ProfileVectorIcon name="map-pin" color={theme.subText} size={14} />
                  <Text style={[styles.infoDetail, { color: theme.subText }]}>{user.address}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* SECTION COMPTE */}
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.myAccount || 'Mon Compte'}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setIsEditProfileVisible(true)}>
            <View style={styles.iconBox}>
              <ProfileVectorIcon name="edit" color="#38bdf8" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.editProfile || 'Éditer le profil'}</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>{t.editProfileSub || 'Nom, téléphone, adresse...'}</Text>
            </View>
            <Text style={{ color: theme.subText, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => setIsPasswordModalVisible(true)}>
            <View style={styles.iconBox}>
              <ProfileVectorIcon name="lock" color="#38bdf8" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.changePassword || 'Changer le mot de passe'}</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>{t.accountSecurity || 'Sécurité du compte'}</Text>
            </View>
            <Text style={{ color: theme.subText, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION SUPPORT & WHATSAPP DIRECT */}
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.supportAndContact || 'Support & Contact Professionnel'}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          
          {/* BOUTON WHATSAPP DIRECT */}
          <TouchableOpacity style={[styles.settingRow, styles.whatsappRow]} onPress={handleOpenWhatsApp}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <ProfileVectorIcon name="whatsapp" color="#22c55e" size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: '#22c55e', fontWeight: 'bold' }]}>WhatsApp ADRWARE</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>+261 38 93 346 87 • Chat, Appel & Vidéo</Text>
            </View>
            <View style={styles.whatsappBadge}>
              <Text style={styles.whatsappBadgeText}>Ouvrir</Text>
            </View>
          </TouchableOpacity>

          {/* SIGNALEMENT DE PANNE (AVEC GPS) */}
          <TouchableOpacity style={styles.settingRow} onPress={() => handleContactSupport('panne')}>
            <View style={styles.iconBox}>
              <ProfileVectorIcon name="warning" color="#f59e0b" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.reportBreakdown || 'Signaler une panne'}</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>{t.prioritySupport || 'Assistance technique prioritaire & GPS'}</Text>
            </View>
            <Text style={{ color: theme.subText, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          {/* REMARQUE OU PROPOSITION (SANS GPS, TEXTE DISTINCT) */}
          <TouchableOpacity style={styles.settingRow} onPress={() => handleContactSupport('proposition')}>
            <View style={styles.iconBox}>
              <ProfileVectorIcon name="lightbulb" color="#f59e0b" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.remarksOrProposals || 'Remarques ou propositions'}</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>{t.formalEmail || "Envoyer un mail formel à l'entreprise"}</Text>
            </View>
            <Text style={{ color: theme.subText, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION PRÉFÉRENCES */}
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>{t.settings || 'Préférences'}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.iconBox}>
              <ProfileVectorIcon name={isDarkMode ? 'moon' : 'sun'} color="#eab308" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.theme || 'Thème'}</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>{isDarkMode ? (t.darkMode || 'Sombre') : (t.lightMode || 'Clair')}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={async (val) => {
                await toggleTheme(val);
                showToast(`${t.theme || 'Thème'} ${val ? (t.darkMode || 'Sombre') : (t.lightMode || 'Clair')} ${t.activated || 'activé'}`, 'info');
              }}
              trackColor={{ false: '#475569', true: theme.accent }}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={() => setIsLangModalVisible(true)}>
            <View style={styles.iconBox}>
              <ProfileVectorIcon name="globe" color="#38bdf8" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.language || 'Langue'}</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>{language}</Text>
            </View>
            <Text style={{ color: theme.subText, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>{t.logout || 'Déconnexion'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL 1 : Édition de Profil */}
      <Modal visible={isEditProfileVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.editInfoModal || 'Modifier mes informations'}</Text>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.firstName || 'Prénom'}
              placeholderTextColor={theme.subText}
              value={profileForm.first_name}
              onChangeText={(v) => setProfileForm(p => ({ ...p, first_name: v }))}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.lastName || 'Nom'}
              placeholderTextColor={theme.subText}
              value={profileForm.last_name}
              onChangeText={(v) => setProfileForm(p => ({ ...p, last_name: v }))}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.phonePlaceholder || 'Téléphone (+261...)'}
              keyboardType="phone-pad"
              placeholderTextColor={theme.subText}
              value={profileForm.phone_number}
              onChangeText={(v) => setProfileForm(p => ({ ...p, phone_number: v }))}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.address || 'Adresse'}
              placeholderTextColor={theme.subText}
              value={profileForm.address}
              onChangeText={(v) => setProfileForm(p => ({ ...p, address: v }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileVisible(false)}>
                <Text style={{ color: '#fff' }}>{t.cancel || 'Annuler'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.accent }]} 
                onPress={handleUpdateProfile} 
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#0f172a" /> : <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{t.save || 'Enregistrer'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2 : Mot de passe */}
      <Modal visible={isPasswordModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.changePasswordModal || 'Changer le mot de passe'}</Text>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.oldPassword || 'Ancien mot de passe'}
              secureTextEntry
              placeholderTextColor={theme.subText}
              value={passwordForm.old_password}
              onChangeText={(v) => setPasswordForm(p => ({ ...p, old_password: v }))}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.newPassword || 'Nouveau mot de passe'}
              secureTextEntry
              placeholderTextColor={theme.subText}
              value={passwordForm.new_password}
              onChangeText={(v) => setPasswordForm(p => ({ ...p, new_password: v }))}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={t.confirmNewPassword || 'Confirmer le nouveau mot de passe'}
              secureTextEntry
              placeholderTextColor={theme.subText}
              value={passwordForm.confirm_password}
              onChangeText={(v) => setPasswordForm(p => ({ ...p, confirm_password: v }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsPasswordModalVisible(false)}>
                <Text style={{ color: '#fff' }}>{t.cancel || 'Annuler'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.accent }]} 
                onPress={handleChangePassword} 
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#0f172a" /> : <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{t.validate || 'Valider'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3 : Langue */}
      <Modal visible={isLangModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsLangModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            {['Français', 'English', 'Malagasy'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={styles.langOption} 
                onPress={async () => {
                  await changeLanguage(item);
                  setIsLangModalVisible(false);
                  showToast(`${t.language || 'Langue'} : ${item}`, 'success');
                }}
              >
                <Text style={{ color: theme.text, fontWeight: language === item ? 'bold' : 'normal' }}>{item}</Text>
                {language === item && <Text style={{ color: theme.accent, fontWeight: 'bold' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  headerCard: { alignItems: 'center', padding: 22, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  profileAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#3b82f6' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  userName: { fontSize: 20, fontWeight: 'bold' },
  userEmail: { fontSize: 13, marginTop: 2, marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoDetail: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  settingsGroup: { borderRadius: 18, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  whatsappRow: { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderBottomWidth: 1, borderBottomColor: 'rgba(34, 197, 94, 0.2)' },
  whatsappBadge: { backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  whatsappBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#ef4444', padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 22, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { backgroundColor: '#475569', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#334155' }
});