/**
 * @file authService.js
 * @description Services proxying authentication endpoints (login, logout, refresh, self, reset-password).
 */
import api from './api';

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (name, email, password, confirmPassword) =>
    api.post('/auth/register', { name, email, password, confirmPassword }),

  registerInvited: (name, password, confirmPassword, token) =>
    api.post('/auth/register-invited', { name, password, confirmPassword, token }),

  verifyEmail: (email, code) =>
    api.post('/auth/verify-email', { email, code }),

  resendVerification: (email) =>
    api.post('/auth/resend-verification', { email }),

  verify2fa: (pendingToken, code) =>
    api.post('/auth/verify-2fa', { pendingToken, code }),

  enable2fa: () =>
    api.post('/auth/2fa/enable'),

  confirm2fa: (code) =>
    api.post('/auth/2fa/confirm', { code }),

  disable2fa: (password) =>
    api.post('/auth/2fa/disable', { password }),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: () =>
    api.post('/auth/refresh'),

  resetPassword: (currentPassword, newPassword, confirmPassword) =>
    api.post('/auth/reset-password', { currentPassword, newPassword, confirmPassword }),

  updateProfile: (name) =>
    api.patch('/auth/profile', { name }),

  /** Called on app boot to get the current user from the valid cookie */
  me: () =>
    api.get('/auth/me'),
};
