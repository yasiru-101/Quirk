/**
 * @file Sidebar.jsx
 * @description Left navigation sidebar for primary app navigation and session controls.
 */
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { normalizeError } from '../../services/api';
import { getInitials, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Members',
    to: '/members',
    managersOnly: true,
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
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
        <path d="M12 3l7 4v5c0 4.5-2.8 7.5-7 9-4.2-1.5-7-4.5-7-9V7l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    label: 'Platform',
    to: '/platform',
    platformOnly: true,
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR],
  },
];

// ── Notion-style collapsible projects tree ────────────────────────────────────
// Lists the active workspace's projects; each links to its task views
// (/tasks?projectId=<id>). Managers get an inline create action.
function ProjectsNav() {
  const { projects, loading, canManageWorkspace } = useProject();
  const { role, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const canCreate = isPlatformAdmin || role === ROLES.ADMIN || role === ROLES.PROJECT_MANAGER || canManageWorkspace;
  const activeProjectId = new URLSearchParams(location.search).get('projectId');

  return (
    <div className="pt-2">
      <div className="group flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider text-white/45">
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
                    'group flex h-10 items-center gap-2.5 rounded-full px-3 text-[15px] font-medium transition focus-ring',
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
  const { user, role, isPlatformAdmin, logout } = useAuth();
  const { workspaces, activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, activeWorkspaceRole, canManageWorkspace, leaveWorkspace, updateWorkspace } = useProject();
  const confirm = useConfirm();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  const openRename = () => {
    setRenameValue(activeWorkspace?.name || '');
    setRenameOpen(true);
  };

  const submitRename = async (event) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (!name) return;
    if (name === activeWorkspace?.name) { setRenameOpen(false); return; }
    setRenaming(true);
    try {
      await updateWorkspace({ name });
      success('Workspace name updated');
      setRenameOpen(false);
    } catch (err) {
      toastError(normalizeError(err).message, 'Could not rename workspace');
    } finally {
      setRenaming(false);
    }
  };
  // Manager access: platform admins, workspace Owners/Admins, or users whose global
  // role manages work. Plain collaborators are excluded.
  const canManage = isPlatformAdmin || canManageWorkspace || role === ROLES.ADMIN || role === ROLES.PROJECT_MANAGER;
  const visibleNav = NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(role) &&
      (!item.platformOnly || isPlatformAdmin) &&
      (!item.managersOnly || canManage)
  );

  const handleLeaveWorkspace = async () => {
    if (!activeWorkspaceId || !activeWorkspace) return;
    const ok = await confirm({
      title: 'Leave workspace',
      message: `Leave ${activeWorkspace.name}? You will lose access to its projects and tasks.`,
      confirmLabel: 'Leave',
      danger: true,
    });
    if (!ok) return;
    await leaveWorkspace();
    navigate('/projects');
  };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col flex-shrink-0 overflow-hidden bg-[var(--colors-surface-dark)] text-white transition-all duration-300',
        collapsed ? 'w-[76px]' : 'w-[268px]'
      )}
    >
      <div className={cn('flex flex-shrink-0 items-center px-5', collapsed ? 'flex-col gap-4 py-5' : 'h-[76px] gap-3')}>
        {collapsed ? (
          <>
            <img src="/logo icon.webp" alt="Quirk" className="h-9 w-9 rounded-xl object-contain" draggable={false} />
            <button
              onClick={onToggle}
              className="rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus-ring"
              aria-label="Expand sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : (
          <img src="/full logo  - white.webp" alt="Quirk" className="h-14 w-auto object-contain" draggable={false} />
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
      </div>

      {!collapsed && (
        <div className="mx-4 mb-3 rounded-[var(--radius-xl)] border border-white/10 bg-[var(--colors-surface-dark-elevated)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Workspace</p>
            <div className="flex items-center gap-1">
              {canManageWorkspace && activeWorkspaceId && (
                <button onClick={openRename} className="text-white/45 hover:text-white transition focus-ring rounded-full p-0.5" title="Rename workspace" aria-label="Rename workspace">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" strokeLinecap="round"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              <button onClick={() => navigate('/onboarding')} className="text-white/45 hover:text-white transition focus-ring rounded-full p-0.5" title="New workspace" aria-label="New workspace">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
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
          {activeWorkspaceId && activeWorkspaceRole && !['Owner', 'Admin'].includes(activeWorkspaceRole) && (
            <button
              type="button"
              onClick={handleLeaveWorkspace}
              className="mt-3 text-xs font-semibold text-white/45 transition hover:text-white focus-ring"
            >
              Leave workspace
            </button>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1.5">
          {visibleNav.map((item) => {
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

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename workspace"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRenameOpen(false)} disabled={renaming}>Cancel</Button>
            <Button variant="primary" onClick={submitRename} loading={renaming} disabled={!renameValue.trim()}>Save changes</Button>
          </div>
        }
      >
        <form onSubmit={submitRename}>
          <Input
            id="workspace-rename"
            label="Workspace name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={80}
            placeholder="Workspace name"
            autoFocus
          />
          <p className="mt-2 text-sm text-[var(--colors-body)]">
            This changes the name for everyone in the workspace.
          </p>
        </form>
      </Modal>

    </aside>
  );
}
