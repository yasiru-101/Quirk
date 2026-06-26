/**
 * @file ProtectedRoute.jsx
 * @description Route route-guard wrapping private app screens.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wrap routes that require authentication. Authorization is enforced per-workspace
 * and per-project at the page and API layers (and via isPlatformAdmin for platform
 * routes), so route entry only requires an authenticated, reset-complete session.
 *
 * @param {React.ReactNode} props.children - Target private screen route element
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, mustResetPassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password reset if mustResetPassword flag is set
  if (mustResetPassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  return children;
}
