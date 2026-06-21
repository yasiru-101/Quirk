/**
 * @file api.js
 * @description Axios HTTP client configuration with credentials sharing, token interceptors, and error handling.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { handleMockRequest } from '../utils/mockData';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (localStorage.getItem('quirk_is_mock') === 'true') {
      const mockRes = handleMockRequest(config);
      if (mockRes !== null) {
        config.adapter = () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: mockRes,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
              });
            }, 180); // Micro-delay to simulate network activity nicely
          });
        };
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
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
    const { message, errors } = error.response.data;
    return { message: message || 'An error occurred', fieldErrors: errors || null };
  }
  if (error?.message) return { message: error.message, fieldErrors: null };
  return { message: 'Network error. Please try again.', fieldErrors: null };
};

export default api;
