/**
 * @file TopBar.jsx
 * @description Top navigation bar managing page titles and real-time user notification badges.
 */
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks':     'Task Workspace',
  '/users':     'User Management',
};

/**
 * Header bar component rendering the active workspace label and embedding notification panels.
 */
export default function TopBar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Quirk';
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <header
        className="h-[60px] flex items-center justify-between px-6 border-b sticky top-0 z-20"
        style={{
          background: 'rgba(9,9,11,0.85)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Page title */}
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <NotificationBell onClick={() => setPanelOpen(true)} />
        </div>
      </header>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
