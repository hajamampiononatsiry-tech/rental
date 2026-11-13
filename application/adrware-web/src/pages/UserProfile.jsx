import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Lock, 
  Edit3,
  X,
  Loader2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function UserProfile() {
  const { language } = useLanguage();

  const t = {
    fr: {
      title: "Profil Utilisateur",
      subtitle: "Gérez vos informations personnelles et la sécurité de votre compte.",
      successSave: "Les modifications ont été enregistrées avec succès !",
      errorLoad: "Impossible de charger les données du profil.",
      changePhoto: "Changer la photo",
      defaultRole: "Administrateur Système",
      editProfile: "Modifier le profil",
      cancel: "Annuler",
      personalInfo: "Informations Personnelles",
      firstName: "Prénom",
      lastName: "Nom",
      emailAddress: "Adresse Email",
      phone: "Téléphone",
      postalAddress: "Adresse Postale",
      saveChanges: "Enregistrer les modifications",
      accountSecurity: "Sécurité du Compte",
      passwordLabel: "Mot de passe",
      passwordDesc: "Modifiez votre mot de passe d'accès",
      changePasswordBtn: "Changer le mot de passe",
      passwordModalTitle: "Changement de mot de passe",
      passwordModalSub: "Définissez un nouveau mot de passe sécurisé",
      oldPassword: "Ancien mot de passe",
      newPassword: "Nouveau mot de passe",
      confirmNewPassword: "Confirmer le nouveau mot de passe",
      validateModification: "Valider la modification",
      successPassword: "Mot de passe modifié avec succès !",
      errorUpdate: "Erreur lors de la mise à jour des informations.",
      errorPassword: "Erreur lors du changement de mot de passe. Vérifiez votre ancien mot de passe.",
      passwordMismatch: "Les nouveaux mots de passe ne correspondent pas."
    },
    en: {
      title: "User Profile",
      subtitle: "Manage your personal information and account security.",
      successSave: "Changes saved successfully!",
      errorLoad: "Unable to load profile data.",
      changePhoto: "Change photo",
      defaultRole: "System Administrator",
      editProfile: "Edit Profile",
      cancel: "Cancel",
      personalInfo: "Personal Information",
      firstName: "First Name",
      lastName: "Last Name",
      emailAddress: "Email Address",
      phone: "Phone",
      postalAddress: "Postal Address",
      saveChanges: "Save Changes",
      accountSecurity: "Account Security",
      passwordLabel: "Password",
      passwordDesc: "Change your access password",
      changePasswordBtn: "Change Password",
      passwordModalTitle: "Change Password",
      passwordModalSub: "Set up a new secure password",
      oldPassword: "Old Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      validateModification: "Confirm Changes",
      successPassword: "Password changed successfully!",
      errorUpdate: "Error updating information.",
      errorPassword: "Error changing password. Check your old password.",
      passwordMismatch: "New passwords do not match."
    },
    mg: {
      title: "Mombamomba ny Mpampiasa",
      subtitle: "Tantano ny mombamomba anao sy ny fiarovana ny kaontinao.",
      successSave: "Voatahiry soa aman-tsara ny fanovana!",
      errorLoad: "Tsy tafiditra ny mombamomba ny kaonty.",
      changePhoto: "Ovay ny sary",
      defaultRole: "Mpitantana ny Rafitra",
      editProfile: "Ovay ny mombamomba",
      cancel: "Aoka ihany",
      personalInfo: "Mombamomba Anao Manokana",
      firstName: "Anarana voalohany",
      lastName: "Fanampiny",
      emailAddress: "Adiresy Mailaka",
      phone: "Telefaonina",
      postalAddress: "Adiresy",
      saveChanges: "Tehirizo ny fanovana",
      accountSecurity: "Fiarovana ny Kaonty",
      passwordLabel: "Tenimiafina",
      passwordDesc: "Ovay ny tenimiafina fidiranao",
      changePasswordBtn: "Ovay ny tenimiafina",
      passwordModalTitle: "Fanovana tenimiafina",
      passwordModalSub: "Mamorona tenimiafina vaovao azo antoka",
      oldPassword: "Tenimiafina taloha",
      newPassword: "Tenimiafina vaovao",
      confirmNewPassword: "Hamafiso ny tenimiafina vaovao",
      validateModification: "Hamafiso ny fanovana",
      successPassword: "Voaova soa aman-tsara ny tenimiafina!",
      errorUpdate: "Nisy olana tamin'ny fanavaozana ny mombamomba.",
      errorPassword: "Nisy olana tamin'ny fanovana tenimiafina. Jereo tsara ny tenimiafinao taloha.",
      passwordMismatch: "Tsy mitovy ny tenimiafina vaovao nampidirina."
    }
  };

  const texts = t[language] || t.fr;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    profilePicture: null
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('accounts/me/');
      const data = response.data;
      
      setFormData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phone: data.phone_number || '',
        address: data.address || '',
        role: texts.defaultRole,
        profilePicture: data.profile_picture || null
      });
      setPreviewImage(data.profile_picture || null);
    } catch (err) {
      toast.error(texts.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = new FormData();
      updateData.append('first_name', formData.firstName);
      updateData.append('last_name', formData.lastName);
      updateData.append('email', formData.email);
      updateData.append('phone_number', formData.phone);
      updateData.append('address', formData.address);

      if (selectedFile) {
        updateData.append('profile_picture', selectedFile);
      }

      const response = await api.patch('accounts/me/', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data }));

      const updatedPic = response.data.profile_picture || null;
      setFormData(prev => ({
        ...prev,
        profilePicture: updatedPic
      }));
      setPreviewImage(updatedPic);

      setIsEditing(false);
      setSelectedFile(null);
      toast.success(texts.successSave);
    } catch (err) {
      toast.error(texts.errorUpdate);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(texts.passwordMismatch);
      return;
    }

    setSaving(true);
    try {
      await api.post('accounts/change-password/', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      });

      toast.success(texts.successPassword);
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(texts.errorPassword);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const initial1 = (formData.firstName ? formData.firstName.charAt(0) : '') || '';
  const initial2 = (formData.lastName ? formData.lastName.charAt(0) : '') || '';
  const userInitials = (initial1 + initial2).toUpperCase() || 'A';

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto p-4 md:p-6">
      <Toaster position="top-right" reverseOrder={false} />

      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-500" /> {texts.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {texts.subtitle}
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              {texts.editProfile}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedFile(null);
                setPreviewImage(formData.profilePicture);
              }}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              {texts.cancel}
            </button>
          )}
        </div>
      </div>

      {/* Carte En-tête Profil */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {previewImage ? (
              <img 
                src={previewImage} 
                alt="Profil" 
                onError={() => setPreviewImage(null)}
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/20 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-3xl">
                {userInitials}
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {isEditing && (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all cursor-pointer"
                title={texts.changePhoto}
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {formData.firstName || 'Administrateur'} {formData.lastName}
            </h2>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formData.role}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire des Informations Personnelles */}
      <form onSubmit={handleSubmitProfile} className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <div>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
              {texts.personalInfo}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.firstName}</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none disabled:opacity-75 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.lastName}</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none disabled:opacity-75 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.emailAddress}</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none disabled:opacity-75 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.phone}</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none disabled:opacity-75 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.postalAddress}</label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none disabled:opacity-75 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white px-6 py-3 rounded-xl text-base font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {texts.saveChanges}
            </button>
          </div>
        )}
      </form>

      {/* Section Sécurité du Compte */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
            {texts.accountSecurity}
          </h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700">
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-800 dark:text-gray-100">{texts.passwordLabel}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{texts.passwordDesc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            {texts.changePasswordBtn}
          </button>
        </div>
      </div>

      {/* Modal Changement de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5" /> {texts.passwordModalTitle}
                </h3>
                <p className="text-xs text-blue-100 font-normal mt-0.5">
                  {texts.passwordModalSub}
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPassword} className="p-6 space-y-5">
              {/* Ancien mot de passe */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.oldPassword}</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    required
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.newPassword}</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmer le nouveau mot de passe */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{texts.confirmNewPassword}</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 text-base outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {texts.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {texts.validateModification}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}