import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, ArrowLeft, Loader2, Phone, MapPin, Camera, Check, X as XIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../assets/logo.png';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Critères de validation du mot de passe en temps réel
  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setFormData((prev) => ({ ...prev, [name]: value.toLowerCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Validation stricte du téléphone (exactement 10 chiffres)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Le numéro de téléphone doit contenir exactement 10 chiffres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
    if (!allCriteriaMet) {
      toast.error("Le mot de passe ne respecte pas toutes les consignes de sécurité.");
      return;
    }

    setLoading(true);

    const dataToSend = new FormData();
    dataToSend.append('first_name', formData.firstName);
    dataToSend.append('last_name', formData.lastName);
    dataToSend.append('email', formData.email.trim().toLowerCase());
    dataToSend.append('password', formData.password);
    dataToSend.append('phone_number', formData.phone);
    dataToSend.append('address', formData.address);
    dataToSend.append('is_admin', 'true');

    if (profilePicture) {
      dataToSend.append('profile_picture', profilePicture);
    }

    try {
      await api.post('accounts/register/', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success("Inscription réussie ! Un lien d'activation a été envoyé au super-administrateur.");
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.email) {
          toast.error(`Email : ${data.email[0]}`);
        } else if (data.password) {
          toast.error(`Mot de passe : ${data.password[0]}`);
        } else {
          toast.error(data.detail || 'Erreur lors de l’inscription.');
        }
      } else {
        toast.error('Impossible de se connecter au serveur backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
        
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="Logo ADRWARE"
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-md mb-2"
          />
          <h1 className="text-2xl font-black text-white tracking-wide">Créer un compte</h1>
          <p className="text-xs text-slate-400 font-medium">Rejoignez la plateforme ADRWARE AutoRental</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-2 border-slate-600 bg-slate-900 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>
              <label
                htmlFor="profilePictureInput"
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-full cursor-pointer shadow-md transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Photo de profil (optionnelle)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Prénom</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Alexandre"
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Nom</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Dupont"
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Adresse Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alexandre@example.com"
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all lowercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Téléphone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0612345678"
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Adresse postale</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Rue de la Paix, 75000 Paris"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Confirmation</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Indicateur dynamique de sécurité du mot de passe (Rouge -> Vert) */}
          <div className="bg-slate-900/40 border border-slate-700/50 p-2.5 rounded-xl space-y-1 text-[11px]">
            <p className={`flex items-center gap-1.5 font-medium ${passwordCriteria.length ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordCriteria.length ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />} 8 caractères minimum
            </p>
            <p className={`flex items-center gap-1.5 font-medium ${passwordCriteria.uppercase ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordCriteria.uppercase ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />} Au moins une majuscule
            </p>
            <p className={`flex items-center gap-1.5 font-medium ${passwordCriteria.lowercase ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordCriteria.lowercase ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />} Au moins une minuscule
            </p>
            <p className={`flex items-center gap-1.5 font-medium ${passwordCriteria.number ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordCriteria.number ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />} Au moins un chiffre
            </p>
            <p className={`flex items-center gap-1.5 font-medium ${passwordCriteria.special ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordCriteria.special ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />} Au moins un caractère spécial
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>S'inscrire</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
          <p className="text-xs text-slate-400">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-blue-400 hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Se connecter
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}