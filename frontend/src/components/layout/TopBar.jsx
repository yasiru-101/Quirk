/**
 * @file TopBar.jsx
 * @description Top navigation bar with breadcrumbs, search, notifications, and quick task creation.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { getInitials } from '../../utils/helpers';

const BREADCRUMBS = {
  '/dashboard': ['Workspace', 'Overview'],
  '/tasks': ['Workspace', 'Tasks'],
  '/users': ['Administration', 'Directory'],
  '/projects': ['Workspace', 'Projects'],
  '/analytics': ['Workspace', 'Analytics'],
  '/settings': ['Account', 'Settings'],
  '/chat': ['Workspace', 'Chat'],
};

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const crumbs = BREADCRUMBS[pathname] ?? ['Quirk', 'Overview'];
  const [panelOpen, setPanelOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { activeWorkspace } = useProject();

  const handleNewTask = () => {
    const createTask = Date.now();
    if (pathname === '/tasks') {
      window.dispatchEvent(new CustomEvent('task:create'));
      return;
    }
    navigate('/tasks', { state: { createTask } });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[60px] flex-shrink-0 items-center justify-between border-b border-[var(--colors-hairline)] bg-[rgba(255,255,255,0.86)] px-6 backdrop-blur-xl dark:bg-[rgba(10,11,13,0.86)]">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--colors-ink-muted)]">
          <span>{activeWorkspace?.name || crumbs[0]}</span>
          <span className="text-[color:var(--colors-ink-faint)]">/</span>
          <span className="text-[color:var(--colors-ink)]">{crumbs[1]}</span>
        </div>

        <div className="mx-4 hidden max-w-[360px] flex-1 md:block">
          <label className="relative block">
            <span className="absolute inset-y-0 left-3 flex items-center text-[color:var(--colors-ink-faint)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search tasks, projects, people"
              className="h-10 w-full rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] pl-9 pr-14 text-[13px] text-[var(--colors-ink)] transition placeholder:text-[var(--colors-ink-faint)] focus-ring"
            />
            <span className="absolute inset-y-0 right-2 flex items-center">
              <kbd className="hidden rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[color:var(--colors-ink-muted)] shadow-sm sm:inline-block">
                Ctrl K
              </kbd>
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-ink)] focus-ring"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            )}
          </button>

          <NotificationBell onClick={() => setPanelOpen(true)} />

          <button
            onClick={handleNewTask}
            className="hidden h-10 items-center rounded-full bg-[var(--colors-primary)] px-4 text-sm font-semibold text-[var(--colors-on-primary)] transition hover:bg-[var(--colors-primary-hover)] focus-ring sm:flex"
          >
            New task
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] text-xs font-bold text-[var(--colors-ink)] focus-ring transition hover:bg-[var(--colors-surface-pressed)]"
            >
              {getInitials(user?.name)}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] py-2 shadow-lg z-50">
                <div className="px-4 py-2 border-b border-[var(--colors-hairline)] mb-1">
                  <p className="truncate text-sm font-semibold text-[var(--colors-ink)]">{user?.name}</p>
                  <p className="truncate text-xs text-[var(--colors-ink-muted)]">{user?.role}</p>
                </div>
                <button
                  onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] transition"
                >
                  Settings
                </button>
                <button
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    if (!window.confirm('Sign out of Quirk?')) return;
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
