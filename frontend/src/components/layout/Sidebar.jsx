/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar for primary app navigation and session controls.
 */
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { getInitials, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import BrandLogo from '../common/BrandLogo';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { normalizeError } from '../../services/api';

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
    id: 'projects',
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Members',
    to: '/members',
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
];

// ── Notion-style collapsible projects tree ────────────────────────────────────
// Lists the active workspace's projects; each links to its task views
// (/tasks?projectId=<id>). Managers get an inline create action.
function ProjectsNav() {
  const { projects, loading, canManageWorkspace } = useProject();
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const canCreate = role === ROLES.ADMIN || canManageWorkspace;
  const activeProjectId = new URLSearchParams(location.search).get('projectId');

  return (
    <div className="pt-2">
      <div className="group flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 transition hover:text-white/70 focus-ring"
          aria-expanded={open}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={cn('transition-transform', open ? 'rotate-90' : '')}>
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Projects</span>
        </button>
        <NavLink to="/projects" className="ml-1 text-white/35 transition hover:text-white/70 focus-ring" title="All projects">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </NavLink>
        {canCreate && (
          <button
            type="button"
            onClick={() => navigate('/projects', { state: { createProject: Date.now() } })}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white focus-ring"
            title="New project"
            aria-label="New project"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      {open && (
        <div className="mt-1 space-y-0.5">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="mx-3 my-1 h-7 animate-pulse rounded-md bg-white/5" />)
          ) : projects.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-white/35">No projects yet.</p>
          ) : (
            projects.map((project) => {
              const isActive = activeProjectId === project.id;
              return (
                <NavLink
                  key={project.id}
                  to={`/tasks?projectId=${project.id}`}
                  className={cn(
                    'group flex h-9 items-center gap-2.5 rounded-full px-3 text-sm font-medium transition focus-ring',
                    isActive
                      ? 'bg-[rgba(114,230,149,0.16)] text-[var(--colors-primary)]'
                      : 'text-white/55 hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                  )}
                >
                  <span className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                    isActive ? 'bg-[var(--colors-primary)] text-black' : 'bg-white/10 text-white/70'
                  )}>
                    {(project.name || 'P').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate">{project.name}</span>
                </NavLink>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuth();
  const { workspaces, activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, activeWorkspaceRole, workspaceLoading, createWorkspace } = useProject();
  const navigate = useNavigate();
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' });
  const [workspaceErrors, setWorkspaceErrors] = useState({});
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const handleSignOut = async () => {
    if (!window.confirm('Sign out of Quirk?')) return;
    await logout();
    navigate('/login');
  };

  const closeWorkspaceModal = () => {
    setWorkspaceModalOpen(false);
    setWorkspaceForm({ name: '', description: '' });
    setWorkspaceErrors({});
  };

  const handleCreateWorkspace = async (event) => {
    event.preventDefault();
    if (!workspaceForm.name.trim()) {
      setWorkspaceErrors({ name: 'Workspace name is required' });
      return;
    }
    setCreatingWorkspace(true);
    try {
      await createWorkspace({
        name: workspaceForm.name.trim(),
        description: workspaceForm.description.trim() || undefined,
      });
      closeWorkspaceModal();
      navigate('/projects');
    } catch (err) {
      const { fieldErrors, message } = normalizeError(err);
      setWorkspaceErrors(fieldErrors || { name: message });
    } finally {
      setCreatingWorkspace(false);
    }
  };

  return (
    <>
      <aside
        className={cn(
          'relative flex h-full flex-col flex-shrink-0 overflow-hidden bg-[var(--colors-surface-dark)] text-white transition-all duration-300',
          collapsed ? 'w-[76px]' : 'w-[268px]'
        )}
      >
        <div className={cn('flex h-[76px] flex-shrink-0 items-center gap-3 px-4', collapsed && 'justify-center')}>
          {collapsed ? (
            <BrandLogo showText={false} size="md" variant="light" />
          ) : (
            <BrandLogo size="lg" variant="light" className="w-[150px]" />
          )}
          <button
            onClick={onToggle}
            className={cn(
              'rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus-ring',
              !collapsed && 'ml-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

      {collapsed && (
        <div className="mb-3 flex justify-center px-2">
          <div
            title={activeWorkspace?.name || 'Workspace'}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-white/10 bg-[var(--colors-surface-dark-elevated)] text-xs font-bold text-white"
          >
            {getInitials(activeWorkspace?.name) || 'W'}
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="mx-4 mb-3 rounded-[var(--radius-xl)] border border-white/10 bg-[var(--colors-surface-dark-elevated)] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Workspace</p>
            <button
              type="button"
              onClick={() => setWorkspaceModalOpen(true)}
              className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-bold text-white/65 transition hover:bg-white/10 hover:text-white focus-ring"
            >
              Add
            </button>
          </div>
          {workspaceLoading ? (
            <div className="mt-2 h-10 w-full animate-pulse rounded-[var(--radius-md)] bg-white/10" />
          ) : workspaces.length > 1 ? (
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
          {visibleNav.map((item) => {
            // Expanded sidebar renders the Projects entry as a collapsible tree;
            // collapsed sidebar keeps the plain icon link.
            if (item.id === 'projects' && !collapsed) {
              return <ProjectsNav key="projects-tree" />;
            }
            return (
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
            );
          })}
        </div>
      </nav>

      {/* Account footer with sign-out */}
      <div className="mt-auto flex-shrink-0 border-t border-white/10 p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white focus-ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-white/10 bg-[var(--colors-surface-dark-elevated)] p-2">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--colors-primary)] text-xs font-bold text-black">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-white/50">{user?.role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold text-white/60 transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white focus-ring"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>

      </aside>

      <Modal
        open={workspaceModalOpen}
        onClose={closeWorkspaceModal}
        title="New workspace"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeWorkspaceModal}>Cancel</Button>
            <Button type="button" variant="primary" loading={creatingWorkspace} onClick={handleCreateWorkspace}>Create workspace</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-5" noValidate>
          <Input
            label="Workspace name"
            name="name"
            value={workspaceForm.name}
            onChange={(event) => {
              setWorkspaceForm((current) => ({ ...current, name: event.target.value }));
              setWorkspaceErrors((current) => ({ ...current, name: '' }));
            }}
            error={workspaceErrors.name}
            placeholder="Acme Product Team"
          />
          <Input
            label="Description"
            type="textarea"
            name="description"
            value={workspaceForm.description}
            onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))}
            error={workspaceErrors.description}
            placeholder="What this workspace is responsible for"
          />
        </form>
      </Modal>
    </>
  );
}
