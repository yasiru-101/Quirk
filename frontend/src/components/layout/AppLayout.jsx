/**
 * @file AppLayout.jsx
 * @description Structure template displaying the floating sidebar and top navigation.
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ErrorBoundary from '../common/ErrorBoundary';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

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
