import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Le code OTP doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('accounts/verify-otp/', { email, otp });

      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-12 h-12 rounded-full border-2 border-blue-500 mb-2" />
          <h1 className="text-xl font-bold text-white">Vérification OTP</h1>
          <p className="text-xs text-slate-400 text-center mt-1">
            Un code de vérification a été envoyé à <span className="text-blue-400 font-semibold">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Code à 6 chiffres</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider le code'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Retour à l'inscription
          </button>
        </div>
      </div>
    </div>
  );
}