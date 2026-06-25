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
import { ProjectProvider } from './context/ProjectContext';
import { ChatProvider }   from './context/ChatContext';
import { ConfirmProvider } from './context/ConfirmContext';

// Guards & Layout
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';
import PlatformLayout from './components/layout/PlatformLayout';

// Pages
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import VerifyEmailPage    from './pages/VerifyEmailPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage      from './pages/DashboardPage';
import TaskBoardPage      from './pages/TaskBoardPage';
import TaskDetailPage     from './pages/TaskDetailPage';
import ProjectsPage       from './pages/ProjectsPage';
import ProjectDetailPage  from './pages/ProjectDetailPage';
import SettingsPage       from './pages/SettingsPage';
import OnboardingPage     from './pages/OnboardingPage';
import WorkspaceMembersPage from './pages/WorkspaceMembersPage';
import AcceptInvitePage    from './pages/AcceptInvitePage';
import PlatformOverviewPage from './pages/PlatformOverviewPage';
import PlatformWorkspacesPage from './pages/PlatformWorkspacesPage';
import PlatformUsersPage   from './pages/PlatformUsersPage';
import PlatformAuditPage   from './pages/PlatformAuditPage';
import ForbiddenPage      from './pages/ForbiddenPage';
import NotFoundPage       from './pages/NotFoundPage';
import ChatPage           from './pages/ChatPage';

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
              <ConfirmProvider>
              <ProjectProvider>
                <ChatProvider>
                <Routes>
                  {/* ── Public ─────────────────────────────────────────────── */}
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/register"       element={<RegisterPage />} />
                <Route path="/verify-email"   element={<VerifyEmailPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/invite/accept"  element={<AcceptInvitePage />} />
                <Route path="/onboarding"     element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                } />
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
                  >
                    <Route path=":id" element={<TaskDetailPage />} />
                  </Route>

                  {/* Projects */}
                  <Route
                    path="projects"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <ProjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="projects/:id"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <ProjectDetailPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Workspace members */}
                  <Route
                    path="members"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <WorkspaceMembersPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Chat & DMs */}
                  <Route
                    path="chat"
                    element={
                      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR]}>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route
                  path="/platform"
                  element={
                    <ProtectedRoute>
                      <PlatformLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<PlatformOverviewPage />} />
                  <Route path="workspaces" element={<PlatformWorkspacesPage />} />
                  <Route path="users" element={<PlatformUsersPage />} />
                  <Route path="audit" element={<PlatformAuditPage />} />
                </Route>

                {/* ── Catch-all ──────────────────────────────────────────── */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </ChatProvider>
              </ProjectProvider>
              </ConfirmProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
