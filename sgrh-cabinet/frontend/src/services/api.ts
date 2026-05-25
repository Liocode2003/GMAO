import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Single-flight refresh : toutes les 401 simultanées attendent le même appel refresh
let refreshPromise: Promise<void> | null = null;
// Empêche toute nouvelle tentative de refresh ou toast après une première redirection
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isRedirecting &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', {}, { withCredentials: true })
            .then(() => { refreshPromise = null; })
            .catch((err) => { refreshPromise = null; throw err; });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        if (!isRedirecting) {
          isRedirecting = true;
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    if (!isRedirecting && status !== 401) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Erreur serveur';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
