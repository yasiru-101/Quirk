/**
 * @file api.js
 * @description Axios HTTP client configuration with credentials sharing, token interceptors, and error handling.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { aliasIds } from '../utils/helpers';


// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies
  headers: { 'Content-Type': 'application/json' },
});

const logEmailDebug = (emailDebug) => {
  if (!emailDebug) return;
  console.groupCollapsed('[Email Debug Copy]');
  console.log('To:', emailDebug.to);
  console.log('Subject:', emailDebug.subject);
  console.log('HTML:', emailDebug.html);
  console.groupEnd();
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// REST payloads are normalized through the shared `aliasIds` helper so the
// `id`/`_id` duality is consistent with the realtime socket layer.
api.interceptors.response.use(
  (response) => {
    if (response?.data) aliasIds(response.data);
    logEmailDebug(response?.data?.emailDebug);
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
        // Refresh also failed, dispatch a custom event so AuthContext can log out.
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
