/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar for primary app navigation and session controls.
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

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
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    label: 'Projects',
    to: '/projects',
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
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    if (!window.confirm('Sign out of Quirk?')) return;
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col flex-shrink-0 overflow-hidden bg-[var(--colors-surface-dark)] text-white transition-all duration-300',
        collapsed ? 'w-[76px]' : 'w-[268px]'
      )}
    >
      <div className="flex h-[76px] flex-shrink-0 items-center gap-3 px-5">
        {collapsed ? (
          <img src="/logo icon.webp" alt="Quirk" className="mx-auto h-9 w-9 rounded-xl object-contain" draggable={false} />
        ) : (
          <img src="/full logo  - white.webp" alt="Quirk" className="h-9 w-auto object-contain" draggable={false} />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="ml-auto rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus-ring"
            aria-label="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus-ring"
            aria-label="Expand sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mx-4 mb-3 rounded-[var(--radius-xl)] border border-white/10 bg-[var(--colors-surface-dark-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Workspace</p>
          <p className="mt-2 truncate text-sm font-semibold text-white">{user?.workspace?.name || 'Quirk workspace'}</p>
          <p className="mt-1 text-xs text-white/50">Focused execution, one board at a time.</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-11 items-center gap-3 rounded-full px-3 text-sm font-semibold transition focus-ring',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-[rgba(114,230,149,0.16)] text-[var(--colors-primary)]'
                    : 'text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('flex-shrink-0', isActive && 'text-[var(--colors-primary)]')}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className={cn('flex items-center gap-3 rounded-[var(--radius-xl)] bg-white/5 p-2.5', collapsed && 'justify-center')}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--colors-primary)] text-sm font-bold text-[var(--colors-on-primary)]">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-white/50">{role}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'mt-3 flex h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-semibold text-white/55 transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white focus-ring',
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
