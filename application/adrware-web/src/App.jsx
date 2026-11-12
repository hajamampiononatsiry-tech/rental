import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages publiques
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyInvoice from './pages/VerifyInvoice';

// Pages protégées
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
import Commandes from './pages/Commandes';
import Facturation from './pages/Facturation';
import Clients from './pages/Clients';
import MaintenancePage from './pages/MaintenancePage';
import UserProfile from './pages/UserProfile';
import AboutUs from './pages/AboutUs';
import VerifyOTP from './pages/VerifyOTP';

// Composant Helper pour envelopper automatiquement les routes protégées dans le Layout
function ProtectedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* 1. ROUTES PUBLIQUES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />      
            <Route path="/verify" element={<VerifyInvoice />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />

            {/* Redirection racine vers dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 2. ROUTES PROTÉGÉES (Nécessitent un token JWT) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/catalogue" element={<Catalogue />} />
                <Route path="/commandes" element={<Commandes />} />
                <Route path="/factures" element={<Facturation />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/userprofile" element={<UserProfile />} />
                <Route path="/aboutus" element={<AboutUs />} />
              </Route>
            </Route>

            {/* 3. ROUTE DE SECOURS 404 */}
            <Route 
              path="*" 
              element={
                <div style={{ padding: 20, color: 'white', background: '#1e293b', minHeight: '100vh' }}>
                  <h2>404 - Page non trouvée</h2>
                  <p>Vérifiez l'URL de votre navigateur.</p>
                </div>
              } 
            />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}