/**
 * @file TopBar.jsx
 * @description Top navigation bar managing page titles, real-time user notification badges, and theme toggle.
 * Uses glassmorphism.
 */
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import { useTheme } from '../../context/ThemeContext';

const BREADCRUMBS = {
  '/dashboard': ['Workspace', 'Overview'],
  '/tasks':     ['Workspace', 'Task Board'],
  '/users':     ['Administration', 'Directory'],
  '/projects':  ['Workspace', 'Projects'],
  '/analytics': ['Workspace', 'Analytics'],
  '/settings':  ['Account', 'Settings'],
};

export default function TopBar() {
  const { pathname } = useLocation();
  const crumbs = BREADCRUMBS[pathname] ?? ['Quirk', 'Overview'];
  const [panelOpen, setPanelOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="h-[52px] flex items-center justify-between px-6 sticky top-0 z-30 bg-[var(--colors-canvas)] border-b border-[var(--colors-hairline)] shadow-sm flex-shrink-0">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[color:var(--colors-ink-muted)] font-medium">
          <span>{crumbs[0]}</span>
          <span className="text-[color:var(--colors-ink-faint)]">/</span>
          <span className="text-[color:var(--colors-ink)]">{crumbs[1]}</span>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-[340px] mx-4 relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[color:var(--colors-ink-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            placeholder="Search tasks, projects, people…"
            className="w-full bg-[var(--colors-surface-pressed)] border border-[var(--colors-hairline)] rounded-[var(--radius-md)] py-1.5 pl-9 pr-12 text-[13px] text-[var(--colors-ink)] focus-ring transition-colors placeholder-[color:var(--colors-ink-faint)]"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[color:var(--colors-ink-muted)] bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] transition-all focus-ring"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>

          <NotificationBell onClick={() => setPanelOpen(true)} />
          
          <button className="hidden sm:flex bg-[var(--colors-primary)] text-[var(--colors-on-primary)] hover:bg-[var(--colors-primary-active)] text-[13px] font-medium px-3 py-1.5 rounded-[var(--radius-sm)] transition-colors">
            + New Task
          </button>

          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ml-1">
            TH
          </div>
        </div>
      </header>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
