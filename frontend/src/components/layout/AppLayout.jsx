/**
 * @file AppLayout.jsx
 * @description Structure template displaying the floating sidebar and top navigation.
 */
import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ErrorBoundary from '../common/ErrorBoundary';
import { useProject } from '../../context/ProjectContext';
import { cn } from '../../utils/helpers';
import MorphPanel from '../ui/ai-input';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { workspaces, workspaceLoading, activeWorkspaceId, activeProject } = useProject();
  const { pathname, search } = useLocation();

  // Close the mobile drawer whenever the route changes so navigating from it
  // returns the user straight to content.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, search]);

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
      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: docked in the flex flow on desktop, off-canvas drawer on mobile. */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative bg-[var(--bg-surface)] border-l border-[var(--colors-hairline)]">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto animate-in">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      
      {/* AI Assistant Floating Bubble */}
      <MorphPanel workspaceId={activeWorkspaceId} projectId={activeProject?.id} />
    </div>
  );
}
