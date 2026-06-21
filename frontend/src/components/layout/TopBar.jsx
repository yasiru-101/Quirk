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

const PAGE_TITLES = {
  '/dashboard': 'Overview',
  '/tasks':     'Task Board',
  '/users':     'Directory',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Quirk';
  const [panelOpen, setPanelOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="h-[80px] flex items-center justify-between px-8 sticky top-0 z-30 bg-[var(--colors-canvas)] border-b border-[var(--colors-hairline)] shadow-sm slide-up">
        {/* Page title */}
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-[var(--colors-primary)] rounded-full shadow-[0_0_10px_var(--colors-primary-glow)]" />
          <h1 className="text-[var(--typography-display-sm)] font-bold text-[var(--colors-ink)] tracking-tight">{title}</h1>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] hover:scale-105 active:scale-95 transition-all focus-ring shadow-sm"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          <NotificationBell onClick={() => setPanelOpen(true)} />
        </div>
      </header>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
