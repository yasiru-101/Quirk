/**
 * @file AppLayout.jsx
 * @description Structure template displaying the floating sidebar and top navigation.
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '../../utils/helpers';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sideW = collapsed ? 72 + 16 : 260 + 16; // width + left margin (16px)

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--colors-ink)] flex">
      {/* Floating Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 relative"
        style={{ marginLeft: sideW }}
      >
        <TopBar />

        <main className="flex-1 p-8 pt-6 max-w-7xl mx-auto w-full animate-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
