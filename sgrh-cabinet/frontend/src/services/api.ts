import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Pas d'injection manuelle de token — les cookies httpOnly sont envoyés automatiquement

// Single-flight refresh : toutes les 401 simultanées attendent le même appel refresh
let refreshPromise: Promise<void> | null = null;

// Response interceptor: handle 401 → refresh via cookie httpOnly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Un seul appel refresh à la fois, même si plusieurs 401 arrivent simultanément
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', {}, { withCredentials: true })
            .then(() => { refreshPromise = null; })
            .catch((err) => { refreshPromise = null; throw err; });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
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
