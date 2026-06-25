import React from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../common/ErrorBoundary';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { cn, getInitials } from '../../utils/helpers';

const NAV_ITEMS = [
  { label: 'Overview', to: '/platform', end: true },
  { label: 'Workspaces', to: '/platform/workspaces' },
  { label: 'Users', to: '/platform/users' },
  { label: 'Audit', to: '/platform/audit' },
];

export default function PlatformLayout() {
  const { user, isPlatformAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!isPlatformAdmin) {
    return <Navigate to="/403" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--colors-canvas)] text-[var(--colors-ink)]">
      <aside className="flex w-[280px] flex-shrink-0 flex-col border-r border-[var(--colors-hairline)] bg-[var(--colors-surface-dark)] text-white">
        <div className="flex h-[76px] items-center px-5">
          <BrandLogo variant="light" size="lg" />
        </div>

        <div className="mx-4 rounded-[var(--radius-xl)] border border-white/10 bg-[var(--colors-surface-dark-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Console</p>
          <p className="mt-2 text-sm font-semibold text-white">Platform administration</p>
          <p className="mt-1 text-xs text-white/50">SaaS operations and support</p>
        </div>

        <nav className="mt-4 flex-1 space-y-1.5 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center rounded-full px-4 text-sm font-semibold transition focus-ring',
                  isActive
                    ? 'bg-[rgba(114,230,149,0.16)] text-[var(--colors-primary)]'
                    : 'text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-white/45">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-ring"
            >
              Workspace app
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-ring"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-[var(--colors-hairline)] bg-[rgba(255,255,255,0.86)] px-6 backdrop-blur-xl dark:bg-[rgba(10,11,13,0.86)]">
          <div className="text-[13px] font-semibold text-[var(--colors-ink-muted)]">
            Platform <span className="mx-2 text-[var(--colors-ink-faint)]">/</span>
            <span className="text-[var(--colors-ink)]">Control plane</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] px-4 py-2 text-sm font-semibold text-[var(--colors-ink)] transition hover:bg-[var(--colors-surface-pressed)] focus-ring"
          >
            Back to workspace
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
