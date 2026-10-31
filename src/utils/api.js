import axios from 'axios';
import { store } from '../redux/store';
import { logout, setBanned, clearBanned } from '../redux/slices/authSlice';

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

function extractErrorMessage(data, errs) {
  if (errs.length === 1 && errs[0]?.message) {
    return errs[0].message;
  }

  if (errs.length > 1) {
    return errs
      .map((e) => (e?.field ? `${e.field}: ${e.message}` : e?.message))
      .filter(Boolean)
      .join('; ');
  }

  return data.error ?? data.message;
}

api.interceptors.response.use(
  (response) => {
    if (store.getState().auth.banned) {
      store.dispatch(clearBanned());
    }
    return response;
  },
  (error) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data ?? {};
    const errs = Array.isArray(data.errors) ? data.errors : Array.isArray(data.details) ? data.details : [];

    const normalised = {
      status,
      message: extractErrorMessage(data, errs) || error.message || 'An unexpected error occurred.',
      errors: errs,
      raw: error,
    };

    if (status === 403 && data.banned) {
      store.dispatch(setBanned({ reason: data.reason, expiresAt: data.expiresAt ?? null }));
    } else if (status === 401 && !error.config?.url?.includes('/auth/login')) {
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
