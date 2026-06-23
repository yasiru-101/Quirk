/**
 * @file ProjectsPage.jsx
 * @description Project overview using workspace project data.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { ROLES } from '../utils/constants';

export default function ProjectsPage() {
  const { role } = useAuth();
  const { projects, loading } = useProject();
  const navigate = useNavigate();
  const canCreate = role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN;

  return (
    <div className="page-shell animate-in space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Workspace</p>
          <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[color:var(--colors-ink)]">
            Projects
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--colors-body)]">
            Browse active project spaces and the Kanban workflows attached to each one.
          </p>
        </div>
        {canCreate && (
          <Button variant="primary">
            New project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-[var(--radius-xl)] bg-[var(--colors-surface-pressed)]" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to define a workflow and start organizing tasks."
          action={canCreate && <Button variant="primary">New project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="feature-card group min-h-56 text-left focus-ring"
            >
              <div className="mb-8 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--colors-surface-dark)] text-sm font-bold text-white">
                  {(project.name || 'P').slice(0, 1).toUpperCase()}
                </div>
                <span className="pill">{project.columns?.length || 0} columns</span>
              </div>
              <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">{project.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--colors-body)]">
                {project.description || 'A focused workspace for tasks, owners, and workflow columns.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(project.columns ?? []).slice(0, 4).map((column) => (
                  <span key={column.id} className="pill bg-[var(--colors-canvas)]">{column.name}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
