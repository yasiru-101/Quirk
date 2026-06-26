/**
 * @file AuthContext.jsx
 * @description Context provider managing authentication states, tokens, and role variables.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * Top-level context provider that wraps the app and handles login requests, token refreshes,
 * and session restoration via the /auth/me endpoint.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: restore session from existing HTTP-only cookie ──────────────
  useEffect(() => {
    authService
      .me()
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Token expiry → force logout ─────────────────────────────────────────────
  useEffect(() => {
    const handle = () => setUser(null);
    window.addEventListener('auth:expired', handle);
    return () => window.removeEventListener('auth:expired', handle);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password);
    if (data.twoFactorRequired) {
      return data;
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const setSession = useCallback((userData) => {
    setUser(userData);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isPlatformAdmin: user?.isPlatformAdmin ?? false,
    mustResetPassword: user?.mustResetPassword ?? false,
    login,
    logout,
    updateUser,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
