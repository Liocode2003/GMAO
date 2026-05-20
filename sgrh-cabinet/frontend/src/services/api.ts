import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Pas d'injection manuelle de token — les cookies httpOnly sont envoyés automatiquement

// Response interceptor: handle 401 → refresh via cookie httpOnly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Le cookie refreshToken est envoyé automatiquement (withCredentials)
        // Le serveur pose un nouveau cookie accessToken dans la réponse
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.error || error.response?.data?.message || 'Erreur serveur';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
