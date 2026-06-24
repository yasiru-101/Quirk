/**
 * @file AppLayout.jsx
 * @description Structure template displaying the floating sidebar and top navigation.
 */
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ErrorBoundary from '../common/ErrorBoundary';
import { useProject } from '../../context/ProjectContext';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { workspaces, workspaceLoading } = useProject();

  // Tenancy gate: every user must belong to at least one workspace. A user with
  // none (a freshly verified self-registration) is sent to onboarding to create
  // their personal workspace before reaching the app shell. Membership-derived
  // so it self-corrects — invited users already have a workspace and pass through.
  if (workspaceLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center app-shell">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--colors-primary)] border-t-transparent" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="h-screen overflow-hidden app-shell text-[var(--colors-ink)] flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative bg-[var(--bg-surface)] border-l border-[var(--colors-hairline)]">
        <TopBar />

        <main className="flex-1 overflow-x-hidden overflow-y-auto animate-in">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
