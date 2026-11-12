import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.88.31:8000/api/', // Votre URL d'API Django
});

// Intercepteur de requête : Ajouter le token JWT à chaque appel
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse : Rafraîchir le token expiré
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Demande d'un nouveau jeton d'accès
          const res = await axios.post('http://192.168.88.27:8000/api/accounts/token/refresh/', {
            refresh: refreshToken,
          });

          // Sauvegarde du nouveau token
          localStorage.setItem('access_token', res.data.access);

          // Réexécution de la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Si le refresh token est aussi expiré, déconnecter l'utilisateur
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;