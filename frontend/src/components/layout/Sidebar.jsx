/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar managing navigation links, system branding, and user session controls.
 * Implements a premium dark floating panel aesthetic.
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    label: 'Dashboard',
    to: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    label: 'Tasks',
    to: '/tasks',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Users',
    to: '/users',
    roles: [ROLES.ADMIN],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    label: 'Projects',
    to: '/projects',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    label: 'Analytics',
    to: '/analytics',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: 'Chat',
    to: '/chat',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    label: 'Settings',
    to: '/settings',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
];

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
        'relative flex flex-col h-full transition-all duration-300 flex-shrink-0',
        'bg-[#0C120E] text-white overflow-hidden',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-[80px] flex-shrink-0">
        {collapsed ? (
          <img src="/logo icon.webp" alt="Quirk" className="w-10 h-10 flex-shrink-0 mx-auto drop-shadow-md" draggable={false} />
        ) : (
          <img src="/full logo  - white.webp" alt="Quirk" className="h-10 w-auto flex-shrink-0 drop-shadow-md" draggable={false} />
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-[rgba(255,255,255,0.5)] hover:text-white transition-all bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-full p-1.5 focus-ring active:scale-95"
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

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-[rgba(255,255,255,0.05)]">
        <div className={cn("bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[var(--radius-md)] p-2 flex items-center gap-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-all", collapsed && "justify-center px-0")}>
          <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-indigo-500 to-green-500 flex items-center justify-center text-[11px] font-bold shadow-sm flex-shrink-0">
            H
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate leading-none mb-1">hackX 2026</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.5)] truncate uppercase tracking-wider">Free Plan</div>
            </div>
          )}
          {!collapsed && (
            <svg className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 rounded-[var(--radius-lg)] px-3.5 h-12 text-[var(--typography-body-md)] font-medium transition-all group relative overflow-hidden',
                isActive 
                  ? 'bg-[var(--colors-primary-glow)] text-[var(--colors-primary)]' 
                  : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--colors-primary)] rounded-r-full shadow-[0_0_8px_var(--colors-primary)]" />
                )}
                <span className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isActive && "drop-shadow-[0_0_6px_rgba(117,238,143,0.5)]")}>
                  {item.icon}
                </span>
                {!collapsed && <span className="whitespace-nowrap tracking-wide">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {/* Spaces Section */}
        {!collapsed && (
          <div className="mt-6 mb-2">
            <div className="px-3.5 text-[10.5px] font-bold tracking-widest text-[rgba(255,255,255,0.4)] uppercase mb-2">Spaces</div>
            <NavLink to="/projects" className="flex items-center gap-2.5 px-3.5 py-1.5 text-[13px] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] rounded-[var(--radius-md)] transition-all group">
              <div className="w-5 h-5 rounded-[5px] bg-[#1aae39] text-[#0C120E] flex items-center justify-center text-[10px] font-bold flex-shrink-0">M</div>
              <span className="flex-1 truncate">Main Board</span>
            </NavLink>
            <NavLink to="/projects/design" className="flex items-center gap-2.5 px-3.5 py-1.5 text-[13px] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] rounded-[var(--radius-md)] transition-all group">
              <div className="w-5 h-5 rounded-[5px] bg-[#62aef0] text-[#0C120E] flex items-center justify-center text-[10px] font-bold flex-shrink-0">D</div>
              <span className="flex-1 truncate">Design System</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="p-4 mt-auto">
        <div className={cn('flex items-center gap-3 rounded-xl p-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.05)] shadow-inner', collapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-full bg-[var(--colors-primary)] text-[#0C120E] flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-[0_0_12px_var(--colors-primary-glow)]">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-[var(--colors-primary)] opacity-90 truncate">{role}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center gap-2 w-full rounded-xl px-4 mt-3 h-10 text-sm font-medium text-[rgba(255,255,255,0.5)] hover:text-rose-400 hover:bg-[rgba(244,63,94,0.1)] transition-all active:scale-95',
            collapsed && 'justify-center px-0'
          )}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
