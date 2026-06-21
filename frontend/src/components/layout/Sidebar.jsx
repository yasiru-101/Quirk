/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar managing navigation links, system branding, and user session controls.
 */
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getRoleBadgeStyle, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import BrandLogo from '../common/BrandLogo';

const NAV_ITEMS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    label: 'Dashboard',
    to: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    label: 'Tasks',
    to: '/tasks',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Users',
    to: '/users',
    roles: [ROLES.ADMIN],
  },
];

/**
 * Renders side navigation links tailored to the user's role.
 * Handles user profile displays, collapse toggles, and sign-out controls.
 *
 * @param {boolean} props.collapsed - Toggle status of the side bar menu
 * @param {Function} props.onToggle - Event handler mapping sidebar expand state changes
 */
export default function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Ask for confirmation before ending the session
    if (!window.confirm('Are you sure you want to sign out?')) return;
    await logout();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-300',
        'border-r',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 h-[60px] border-b" style={{ borderColor: 'var(--border)' }}>
        {collapsed ? (
          <img src="/favicon.svg" alt="Quirk" className="w-7 h-7 flex-shrink-0" draggable={false} />
        ) : (
          <BrandLogo size="md" showText={true} />
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors focus-ring rounded p-0.5"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              : <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 h-9 text-sm transition-all',
                'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800',
                isActive && 'text-zinc-100 bg-zinc-800 font-medium'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex-shrink-0', isActive ? 'text-indigo-400' : '')}>
                  {item.icon}
                </span>
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div
        className="border-t px-3 py-3 space-y-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-semibold flex-shrink-0 ring-1 ring-indigo-500/30">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-200 truncate">{user?.name}</p>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ring-inset inline-block mt-0.5', getRoleBadgeStyle(role))}>
                {role}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg px-3 h-8 text-xs text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
