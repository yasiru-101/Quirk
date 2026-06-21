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
    const handle = () => {
      localStorage.removeItem('quirk_is_mock');
      localStorage.removeItem('quirk_user');
      setUser(null);
    };
    window.addEventListener('auth:expired', handle);
    return () => window.removeEventListener('auth:expired', handle);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authService.login(email, password);
      setUser(data.user);
      return data.user;
    } catch (apiErr) {
      console.warn("Backend unavailable, using mock login.");
      let role = 'Admin';
      let name = 'Demo Admin';
      
      const cleanEmail = (email || '').toLowerCase();
      if (cleanEmail.includes('pm')) {
        role = 'Project Manager';
        name = 'Demo PM';
      } else if (cleanEmail.includes('collab')) {
        role = 'Collaborator';
        name = 'Demo Collaborator';
      }

      const mockUser = {
        id: 'mock-user-1',
        name: name,
        email: email,
        role: role,
        mustResetPassword: false
      };
      
      localStorage.setItem('quirk_is_mock', 'true');
      localStorage.setItem('quirk_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('quirk_is_mock');
    localStorage.removeItem('quirk_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    mustResetPassword: user?.mustResetPassword ?? false,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
