import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('accounts/password_reset/', { email });
      setMessage('Un email contenant les instructions vous a été envoyé.');
    } catch (err) {
      setError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse saisie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-2">Mot de passe oublié ?</h2>
        <p className="text-xs text-slate-400 mb-6">Saisissez votre email pour recevoir le lien de réinitialisation.</p>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer le lien'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}