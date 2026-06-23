/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar for primary app navigation and session controls.
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
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
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuth();
  const { workspaces, activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, activeWorkspaceRole } = useProject();
  const navigate = useNavigate();
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

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
          {workspaces.length > 1 ? (
            <div className="relative mt-2">
              <select
                value={activeWorkspaceId}
                onChange={(event) => setActiveWorkspaceId(event.target.value)}
                className="h-10 w-full appearance-none rounded-[var(--radius-md)] border border-white/10 bg-black/20 px-3 pr-8 text-sm font-semibold text-white outline-none transition focus:border-[var(--colors-primary)]"
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ) : (
            <p className="mt-2 truncate text-sm font-semibold text-white">{activeWorkspace?.name || 'No workspace yet'}</p>
          )}
          <p className="mt-2 text-xs text-white/50">{activeWorkspaceRole || 'Set up a workspace to begin.'}</p>
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

    </aside>
  );
}
