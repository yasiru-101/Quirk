/**
 * @file App.jsx
 * @description Root component that configures React Router, context providers (Auth, Socket, Toast), 
 * and application routes with role-based access control guards.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider }   from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider }  from './context/ToastContext';
import { ThemeProvider }  from './context/ThemeContext';

// Guards & Layout
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';

// Pages
import LoginPage          from './pages/LoginPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import DashboardPage      from './pages/DashboardPage';
import TaskBoardPage      from './pages/TaskBoardPage';
import TaskDetailPage     from './pages/TaskDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import ForbiddenPage      from './pages/ForbiddenPage';
import NotFoundPage       from './pages/NotFoundPage';

import { ROLES } from './utils/constants';

/**
 * Main App component rendering the provider hierarchy and routing table.
 * Handles routing setup and role authorization constraints for children screens.
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <Routes>
                {/* ── Public ─────────────────────────────────────────────── */}
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/403"            element={<ForbiddenPage />} />
                <Route path="/404"            element={<NotFoundPage />} />

                {/* ── Protected shell ────────────────────────────────────── */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Default redirect */}
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* All authenticated roles */}
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin + PM + Collaborator */}
                  <Route
                    path="tasks"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <TaskBoardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="tasks/:id"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <TaskDetailPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin only */}
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                        <UserManagementPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* ── Catch-all ──────────────────────────────────────────── */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
