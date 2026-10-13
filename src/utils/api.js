import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token =
    store.getState().auth.token ?? localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data ?? {};

    const normalised = {
      status,
      message: data.error ?? data.message ?? error.message ?? 'An unexpected error occurred.',
      errors: Array.isArray(data.errors) ? data.errors : Array.isArray(data.details) ? data.details : [],
      raw: error,
    };

    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      store.dispatch(logout());
    }

    return Promise.reject(normalised);
  },
);

export function apiUpload(method, url, formData, config = {}) {
  return api.request({
    method,
    url,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  });
}

export default api;
