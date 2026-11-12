import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, UserPlus } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('accounts/login/', {
        username: formData.email,
        password: formData.password,
        is_web: true,
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || err.response.data.error || 'Email ou mot de passe incorrect.');
      } else {
        setError('Impossible de se connecter au serveur backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
        
        {/* En-tête / Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="Logo ADRWARE"
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md mb-3"
          />
          <h1 className="text-2xl font-black text-white tracking-wide">ADRWARE</h1>
          <p className="text-xs text-slate-400 font-medium">AutoRental — Espace Administration</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Formulaire de Connexion */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Adresse Email Administrateur
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@adrware.com"
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Mot de passe
              </label>
              <a href="/forgot-password" className="text-[11px] font-medium text-blue-400 hover:underline">
                Mot de passe oublié ?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        {/* Lien Créer un compte */}
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un nouveau compte administrateur</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
