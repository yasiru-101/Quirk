/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar managing navigation links, system branding, and user session controls.
 * Implements the Quirk Polarity Flip design pattern.
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getRoleBadgeStyle, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import BrandLogo from '../common/BrandLogo';

const NAV_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    label: 'Dashboard',
    to: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    label: 'Tasks',
    to: '/tasks',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
 *
 * @param {boolean} props.collapsed - Toggle status of the side bar menu
 * @param {Function} props.onToggle - Event handler mapping sidebar expand state changes
 */
export default function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    await logout();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-300',
        'bg-[var(--colors-ink)] dark:bg-[var(--colors-canvas-soft)]', // Polarity flip
        collapsed ? 'w-[64px]' : 'w-[248px]' // Width constraints from design.md
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-[60px] flex-shrink-0">
        {collapsed ? (
          <img src="/logo icon.webp" alt="Quirk" className="w-8 h-8 flex-shrink-0" draggable={false} />
        ) : (
          <BrandLogo size="md" showText={true} />
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-[var(--colors-on-dark-mute)] hover:text-[var(--colors-on-dark)] transition-colors focus-ring rounded p-1"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              : <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-4 h-10 text-[var(--typography-body-md)] font-medium transition-all',
                isActive 
                  ? 'bg-[var(--colors-canvas)] text-[var(--colors-ink)] dark:bg-[var(--colors-primary)] dark:text-[var(--colors-on-mint)]' // Active state polarity
                  : 'text-[var(--colors-on-dark-mute)] hover:text-[var(--colors-on-dark)] hover:bg-[rgba(255,255,255,0.05)]' // Inactive state
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 space-y-2 mt-auto">
        <div className={cn('flex items-center gap-3 rounded-xl p-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-[var(--colors-primary-glow)] text-[var(--colors-primary)] flex items-center justify-center text-xs font-semibold flex-shrink-0 ring-1 ring-[var(--colors-primary)]">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--colors-on-dark)] truncate">{user?.name}</p>
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
            'flex items-center gap-2 w-full rounded-full px-4 h-9 text-sm text-[var(--colors-on-dark-mute)] hover:text-[var(--colors-priority-urgent)] hover:bg-[rgba(255,255,255,0.05)] transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
