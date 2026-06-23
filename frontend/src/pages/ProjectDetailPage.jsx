/**
 * @file ProjectDetailPage.jsx
 * @description Project scoped overview.
 */
import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, setActiveProject } = useProject();
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN;
  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);

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
            <Button variant="secondary" onClick={() => navigate('/tasks')}>
              Open tasks
            </Button>
            {isPM && <Button variant="primary">Manage columns</Button>}
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
    </div>
  );
}
