/**
 * @file ProjectDetailPage.jsx
 * @description Project scoped overview.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import { ROLES } from '../utils/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    setActiveProject,
    workspaceMembers,
    canManageWorkspace,
    addProjectMember,
    removeProjectMember,
  } = useProject();
  const { role, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'Collaborator' });
  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);
  const projectMembership = project?.members?.find((member) => member.userId === user?.id || member.user?.id === user?.id);
  const isPM = role === ROLES.ADMIN || canManageWorkspace || projectMembership?.role === ROLES.PROJECT_MANAGER;
  const assignableMembers = workspaceMembers.filter(
    (member) => !project?.members?.some((projectMember) => projectMember.userId === member.userId)
  );

  useEffect(() => {
    if (project) setActiveProject(project);
    return () => setActiveProject(null);
  }, [project, setActiveProject]);

  if (!project) {
    return (
      <div className="page-shell animate-in">
        <EmptyState
          title="Project not found"
          description="This project may have been removed or you may not have access."
          action={<Button variant="secondary" onClick={() => navigate('/projects')}>Back to projects</Button>}
        />
      </div>
    );
  }

  return (
    <div className="page-shell animate-in space-y-8">
      <header className="dark-product-card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Project</p>
            <h1 className="text-[length:var(--typography-heading-1)] font-normal text-white">{project.name}</h1>
            <p className="mt-3 max-w-2xl text-white/62">
              {project.description || 'Review this project workflow and jump into its task board.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate(`/tasks?projectId=${project.id}`)}>
              Open project tasks
            </Button>
            {isPM && <Button variant="primary" onClick={() => navigate(`/tasks?projectId=${project.id}`, { state: { createTask: Date.now() } })}>New task</Button>}
          </div>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="feature-card">
          <p className="text-sm font-semibold text-[var(--colors-ink-muted)]">Workflow columns</p>
          <p className="cb-mono mt-3 text-[length:var(--typography-heading-2)]">{project.columns?.length || 0}</p>
        </div>
        <div className="feature-card">
          <p className="text-sm font-semibold text-[var(--colors-ink-muted)]">Status source</p>
          <p className="mt-3 text-lg font-semibold">Kanban column</p>
        </div>
        <div className="feature-card">
          <p className="text-sm font-semibold text-[var(--colors-ink-muted)]">Visibility</p>
          <p className="mt-3 text-lg font-semibold">Workspace members</p>
        </div>
      </div>

      <section className="feature-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[length:var(--typography-title)] font-semibold">Workflow</h2>
          <span className="pill">Project board</span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {(project.columns ?? []).map((column) => (
            <div key={column.id} className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
              <p className="font-semibold text-[var(--colors-ink)]">{column.name}</p>
              <p className="mt-2 text-sm text-[var(--colors-body)]">Tasks in this column inherit this workflow state.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-card">
        <div className="mb-5">
          <h2 className="text-[length:var(--typography-title)] font-semibold">Members</h2>
          <p className="mt-1 text-sm text-[var(--colors-body)]">Project managers can assign workspace members to this project.</p>
        </div>

        <div className="space-y-3">
          {(project.members ?? []).map((member) => (
            <div key={member.userId} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-4 py-3">
              <div>
                <p className="font-semibold text-[var(--colors-ink)]">{member.user?.name || 'Project member'}</p>
                <p className="text-sm text-[var(--colors-body)]">{member.user?.email || member.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="pill">{member.role}</span>
                {isPM && member.userId !== user?.id && (
                  <Button
                    variant="utility"
                    size="sm"
                    onClick={async () => {
                      try {
                        await removeProjectMember(project.id, member.userId);
                        success('Member removed');
                      } catch (err) {
                        const { message } = normalizeError(err);
                        toastError(message, 'Remove failed');
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isPM && (
          <form
            className="mt-5 grid gap-3 border-t border-[var(--colors-hairline)] pt-5 md:grid-cols-[1fr_180px_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!memberForm.userId) return;
              try {
                await addProjectMember(project.id, memberForm);
                setMemberForm({ userId: '', role: 'Collaborator' });
                success('Member assigned');
              } catch (err) {
                const { message } = normalizeError(err);
                toastError(message, 'Assign failed');
              }
            }}
          >
            <select
              value={memberForm.userId}
              onChange={(event) => setMemberForm((current) => ({ ...current, userId: event.target.value }))}
              className="h-11 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] px-3 text-sm text-[var(--colors-ink)] outline-none focus:border-[var(--colors-primary)]"
            >
              <option value="">Select workspace member</option>
              {assignableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>{member.user?.name} ({member.user?.email})</option>
              ))}
            </select>
            <select
              value={memberForm.role}
              onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}
              className="h-11 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] px-3 text-sm text-[var(--colors-ink)] outline-none focus:border-[var(--colors-primary)]"
            >
              <option>Collaborator</option>
              <option>Project Manager</option>
            </select>
            <Button type="submit" variant="primary" disabled={!memberForm.userId}>Add member</Button>
          </form>
        )}
      </section>
    </div>
  );
}
