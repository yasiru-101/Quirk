/**
 * @file ProjectsPage.jsx
 * @description Project overview using workspace project data.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import SelectField from '../components/common/SelectField';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { normalizeError } from '../services/api';
import api from '../services/api';
import { ROLES } from '../utils/constants';

const EMPTY_PROJECT = {
  name: '',
  description: '',
  templateId: '',
  workspaceId: '',
};

// Built-in starter workflows. Selecting one prefills the editable column list so
// the board starts with the workflow the user wants — no DB template required.
const STARTER_TEMPLATES = [
  { key: 'Basic Kanban', label: 'Basic Kanban', columns: ['To Do', 'In Progress', 'Done'] },
  { key: 'Software Development', label: 'Software Development', columns: ['Backlog', 'To Do', 'In Progress', 'In Review', 'QA Testing', 'Done'] },
  { key: 'Marketing Campaign', label: 'Marketing Campaign', columns: ['Ideas', 'Planning', 'In Progress', 'Review', 'Published'] },
];
const DEFAULT_TEMPLATE = STARTER_TEMPLATES[0];

export default function ProjectsPage() {
  const { isPlatformAdmin } = useAuth();
  const {
    workspaces,
    activeWorkspaceId,
    projects,
    loading,
    activeWorkspace,
    activeWorkspaceRole,
    canManageWorkspace,
    createProject,
    updateProject,
    deleteProject,
  } = useProject();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = isPlatformAdmin || canManageWorkspace || activeWorkspaceRole === ROLES.PROJECT_MANAGER;
  const [modal, setModal] = useState({ open: false, project: null });
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [preset, setPreset] = useState(DEFAULT_TEMPLATE.key);
  const [columns, setColumns] = useState(DEFAULT_TEMPLATE.columns.map((name) => ({ name })));

  const applyPreset = (key) => {
    const template = STARTER_TEMPLATES.find((t) => t.key === key) || DEFAULT_TEMPLATE;
    setPreset(key);
    setColumns(template.columns.map((name) => ({ name })));
  };

  const updateColumn = (index, value) =>
    setColumns((cols) => cols.map((c, i) => (i === index ? { name: value } : c)));
  const addColumn = () => setColumns((cols) => [...cols, { name: '' }]);
  const removeColumn = (index) => setColumns((cols) => cols.filter((_, i) => i !== index));
  const moveColumn = (index, delta) =>
    setColumns((cols) => {
      const next = [...cols];
      const target = index + delta;
      if (target < 0 || target >= next.length) return cols;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const openCreate = () => {
    setForm(EMPTY_PROJECT);
    applyPreset(DEFAULT_TEMPLATE.key);
    setErrors({});
    setModal({ open: true, project: null });
  };

  const openEdit = (project) => {
    setForm({
      name: project.name || '',
      description: project.description || '',
      templateId: project.templateId || '',
      workspaceId: project.workspaceId || '',
    });
    setErrors({});
    setModal({ open: true, project });
  };

  const closeModal = () => {
    setModal({ open: false, project: null });
    setErrors({});
  };

  // Open the create modal when navigated here with a create intent (e.g. from
  // the sidebar projects tree's "+ New project" action).
  React.useEffect(() => {
    if (location.state?.createProject && canCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.createProject]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Project name is required' });
      return;
    }
    
    if (isPlatformAdmin && !activeWorkspaceId && !form.workspaceId) {
      setErrors({ workspaceId: 'Workspace is required for platform admins without an active workspace.' });
      return;
    }

    setSaving(true);
    try {
      if (modal.project) {
        await updateProject(modal.project.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        success('Project updated');
      } else {
        const cleanedColumns = columns
          .map((c) => ({ name: c.name.trim() }))
          .filter((c) => c.name);
        if (cleanedColumns.length === 0) {
          setErrors({ columns: 'Add at least one column' });
          setSaving(false);
          return;
        }
        await createProject({
          name: form.name.trim(),
          description: form.description.trim(),
          templateType: preset,
          columns: cleanedColumns.map((c, idx) => ({ name: c.name, order: idx })),
          workspaceId: form.workspaceId || activeWorkspaceId,
        });
        success('Project created');
      }
      closeModal();
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      toastError(message, modal.project ? 'Update failed' : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const archiveProject = async (project) => {
    const ok = await confirm({
      title: 'Archive project',
      message: `Archive ${project.name}? Tasks remain available, but the project is hidden from active work.`,
      confirmLabel: 'Archive',
    });
    if (!ok) return;
    try {
      await updateProject(project.id, { status: 'archived' });
      success('Project archived');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Archive failed');
    }
  };

  const removeProject = async (project) => {
    const ok = await confirm({
      title: 'Delete project',
      message: `Delete ${project.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProject(project.id);
      success('Project deleted');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Delete failed');
    }
  };

  return (
    <div className="page-shell animate-in space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Workspace</p>
          <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[color:var(--colors-ink)]">
            Projects
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--colors-body)]">
            Browse active project spaces in {activeWorkspace?.name || 'your workspace'} and the Kanban workflows attached to each one.
          </p>
          {activeWorkspaceRole && (
            <p className="mt-2 text-sm text-[var(--colors-ink-muted)]">Your workspace role: {activeWorkspaceRole}</p>
          )}
        </div>
        {canCreate && (
          <Button variant="primary" onClick={openCreate}>
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
          action={canCreate && <Button variant="primary" onClick={openCreate}>New project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="feature-card group relative min-h-56 text-left">
              <div className="mb-8 flex items-start justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--colors-surface-dark)] text-sm font-bold text-white focus-ring"
                  aria-label={`Open ${project.name} board`}
                >
                  {(project.name || 'P').slice(0, 1).toUpperCase()}
                </button>
                <div className="flex items-center gap-2">
                  <span className="pill">{project.columns?.length || 0} columns</span>
                  {project.status === 'archived' && <span className="pill">Archived</span>}
                  {canCreate && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-canvas-soft)] hover:text-[var(--colors-ink)] focus-ring"
                        aria-label={`${project.name} settings`}
                        aria-haspopup="menu"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
                      </button>
                      {menuId === project.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                          <div role="menu" onKeyDown={(e) => e.key === 'Escape' && setMenuId(null)} className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] py-1 shadow-lg">
                            {[
                              ['Project settings', () => navigate(`/projects/${project.id}`)],
                              ['Edit details', () => openEdit(project)],
                              ...(project.status !== 'archived' ? [['Archive', () => archiveProject(project)]] : []),
                            ].map(([label, fn]) => (
                              <button key={label} role="menuitem" onClick={() => { setMenuId(null); fn(); }}
                                className="block w-full px-4 py-2 text-left text-sm text-[var(--colors-ink)] transition hover:bg-[var(--colors-canvas-soft)]">
                                {label}
                              </button>
                            ))}
                            <button role="menuitem" onClick={() => { setMenuId(null); removeProject(project); }}
                              className="block w-full border-t border-[var(--colors-hairline)] px-4 py-2 text-left text-sm text-[var(--colors-priority-urgent)] transition hover:bg-[var(--colors-canvas-soft)]">
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => navigate(`/tasks?projectId=${project.id}`)} className="text-left focus-ring">
                <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">{project.name}</h2>
              </button>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--colors-body)]">
                {project.description || 'A focused workspace for tasks, owners, and workflow columns.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(project.columns ?? []).slice(0, 4).map((column) => (
                  <span key={column.id} className="pill bg-[var(--colors-canvas)]">{column.name}</span>
                ))}
                {(project.columns ?? []).length > 4 && (
                  <span className="pill bg-[var(--colors-canvas)]">+{project.columns.length - 4} more</span>
                )}
              </div>
              <div className="mt-6 border-t border-[var(--colors-hairline)] pt-4">
                <button type="button" onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                  className="text-sm font-semibold text-[var(--colors-primary)] hover:underline focus-ring">
                  Open board →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.project ? 'Edit project' : 'New project'}
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit}>
              {modal.project ? 'Save project' : 'Create project'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Project name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Mobile app launch"
          />
          <Input
            label="Description"
            type="textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="What this project is responsible for"
          />
          {!modal.project && (
            <>
              {isPlatformAdmin && !activeWorkspaceId && workspaces.length > 0 && (
                <SelectField
                  label="Workspace"
                  name="workspaceId"
                  value={form.workspaceId}
                  onChange={handleChange}
                  error={errors.workspaceId}
                  placeholder="Select workspace..."
                  options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
                />
              )}
              <div className="space-y-3">
                <p className="text-[length:var(--typography-body-sm)] font-semibold text-[var(--colors-ink)]">Workflow template</p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => applyPreset(t.key)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-ring ${
                        preset === t.key
                          ? 'border-[var(--colors-primary)] bg-[var(--colors-primary-glow)] text-[var(--colors-primary-active)]'
                          : 'border-[var(--colors-hairline)] bg-[var(--colors-canvas)] text-[var(--colors-ink)] hover:border-[var(--colors-surface-pressed)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[length:var(--typography-body-sm)] font-semibold text-[var(--colors-ink)]">Columns</p>
                  <span className="text-xs text-[var(--colors-ink-muted)]">Customize before creating</span>
                </div>
                {errors.columns && <p className="text-sm text-[var(--colors-priority-urgent)]">{errors.columns}</p>}
                <div className="space-y-2">
                  {columns.map((col, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={col.name}
                        onChange={(e) => updateColumn(index, e.target.value)}
                        placeholder={`Column ${index + 1}`}
                        className="h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-softer)] px-3 text-sm text-[var(--colors-ink)] outline-none transition focus:border-[var(--colors-primary)]"
                      />
                      <div className="flex items-center">
                        <button type="button" onClick={() => moveColumn(index, -1)} disabled={index === 0} aria-label="Move up"
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-canvas-soft)] disabled:opacity-30 focus-ring">↑</button>
                        <button type="button" onClick={() => moveColumn(index, 1)} disabled={index === columns.length - 1} aria-label="Move down"
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-canvas-soft)] disabled:opacity-30 focus-ring">↓</button>
                        <button type="button" onClick={() => removeColumn(index)} disabled={columns.length === 1} aria-label="Remove column"
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-canvas-soft)] hover:text-[var(--colors-priority-urgent)] disabled:opacity-30 focus-ring">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                {columns.length < 12 && (
                  <button type="button" onClick={addColumn} className="text-sm font-semibold text-[var(--colors-primary)] hover:underline focus-ring">
                    + Add column
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
