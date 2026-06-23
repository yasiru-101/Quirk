/**
 * @file api.js
 * @description Axios HTTP client configuration with credentials sharing, token interceptors, and error handling.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';


// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // You can attach auth tokens here if not using HTTP-only cookies
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── id → _id Normalizer ──────────────────────────────────────────────────────
// The backend (Prisma/PostgreSQL) returns UUID string `id` fields, while some
// components and the realtime socket payloads reference `_id`. Recursively alias
// `id` to `_id` on every REST response so both shapes are available to components.
const aliasIds = (value) => {
  if (Array.isArray(value)) {
    value.forEach(aliasIds);
  } else if (value && typeof value === 'object') {
    if ('id' in value && !('_id' in value)) value._id = value.id;
    Object.values(value).forEach(aliasIds);
  }
  return value;
};

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (response?.data) aliasIds(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh token on 401, once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch {
        // Refresh also failed — dispatch a custom event so AuthContext can log out
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Error Normalizer ─────────────────────────────────────────────────────────
// Extracts a human-readable message from any Axios error
export const normalizeError = (error) => {
  if (error?.response?.data) {
    const { message, errors, code, email } = error.response.data;
    return { 
      message: message || 'An error occurred', 
      fieldErrors: errors || null,
      code,
      email
    };
  }
  if (error?.message) return { message: error.message, fieldErrors: null, code: null, email: null };
  return { message: 'Network error. Please try again.', fieldErrors: null, code: null, email: null };
};

export default api;
