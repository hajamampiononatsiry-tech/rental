import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('access_token');

  // Si aucun jeton n'est trouvé, rediriger vers la page de connexion
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est authentifié, rendre le contenu de la route
  return <Outlet />;
}