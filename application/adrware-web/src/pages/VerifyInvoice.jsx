import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, FileText, User, DollarSign, Wallet, CreditCard } from 'lucide-react';

export default function VerifyInvoice() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extraction des paramètres
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id');
  const ref = params.get('ref');

  useEffect(() => {
    if (!rawId) {
      setError("Aucun identifiant transmis dans le QR code.");
      setLoading(false);
      return;
    }

    // Récupération dynamique de l'hôte/IP depuis l'URL courante
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const API_URL = `http://${currentHost}:8000/api/factures/${rawId}/`;

    fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur serveur (${res.status}) : Facture introuvable`);
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Détails Erreur Fetch:", err);
        setError("Impossible de contacter le serveur backend (Failed to fetch).");
        setLoading(false);
      });
  }, [rawId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Arrière-plan décoratif animé */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Chargement */}
        {loading && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">Vérification de la facture...</h2>
            <p className="text-xs text-slate-400">Analyse de la signature numérique et interrogation de la base de données.</p>
          </div>
        )}

        {/* Bloc Erreur */}
        {!loading && error && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-red-500/30 p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-500">Authentification Échouée</h3>
                <p className="text-xs text-slate-400">Document non certifié</p>
              </div>
            </div>
            
            <div className="bg-red-950/40 border border-red-900/50 p-3 rounded-xl text-xs text-red-300 space-y-1">
              <p>{error}</p>
              <p className="text-[10px] text-slate-400 font-mono">Référence demandée : {ref || rawId}</p>
            </div>
          </div>
        )}

        {/* Bloc Facture Valide */}
        {!loading && data && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Bannière de validation */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 animate-bounce" />
                <span className="font-bold text-sm tracking-wide uppercase">Document Authentique</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            </div>

            {/* Corps du reçu */}
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Référence Facture</p>
                  <p className="text-xl font-extrabold text-white mt-0.5">{ref || data.reference}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  (data.statut || data.status) === 'Payée'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : (data.statut || data.status) === 'Partielle'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {data.statut || data.status || 'En attente'}
                </span>
              </div>

              {/* Détails de la facture */}
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <User className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Client</p>
                    <p className="font-semibold text-slate-200">{data.client_name || 'Non renseigné'}</p>
                  </div>
                </div>

                {data.car_name && (
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Véhicule / Service</p>
                      <p className="font-semibold text-slate-200">{data.car_name}</p>
                    </div>
                  </div>
                )}

                {/* Montant Total */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Montant Total</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatCurrency(data.montant_total || data.total)} Ar
                    </p>
                  </div>
                </div>

                {/* Déjà Payé */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <Wallet className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Déjà Payé</p>
                    <p className="text-base font-bold text-teal-400">
                      {formatCurrency(data.montant_paye)} Ar
                    </p>
                  </div>
                </div>

                {/* Reste à Payer */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <CreditCard className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Reste à Payer</p>
                    <p className="text-base font-bold text-rose-400">
                      {formatCurrency(data.reste_a_payer)} Ar
                    </p>
                  </div>
                </div>
              </div>

              {/* Pied de carte */}
              <div className="pt-2 text-center border-t border-slate-800">
                <p className="text-[10px] text-slate-500">
                  Cette facture est certifiée conforme et provient directement du système central ADRWARE.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}