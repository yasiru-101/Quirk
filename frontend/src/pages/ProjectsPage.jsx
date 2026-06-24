/**
 * @file ProjectsPage.jsx
 * @description Project overview using workspace project data.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import SelectField from '../components/common/SelectField';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import api, { normalizeError } from '../services/api';
import { ROLES } from '../utils/constants';

const EMPTY_PROJECT = {
  name: '',
  description: '',
  templateId: '',
  workspaceId: '',
};

export default function ProjectsPage() {
  const { role } = useAuth();
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
  const navigate = useNavigate();
  const canCreate = role === ROLES.ADMIN || canManageWorkspace;
  const [modal, setModal] = useState({ open: false, project: null });
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);

  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get('/templates');
        setTemplates(data.templates || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_PROJECT);
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
    
    if (role === ROLES.ADMIN && !activeWorkspaceId && !form.workspaceId) {
      setErrors({ workspaceId: 'Workspace is required for Admins without an active workspace.' });
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
        await createProject({
          name: form.name.trim(),
          description: form.description.trim(),
          templateId: form.templateId || undefined,
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
    if (!window.confirm(`Archive ${project.name}? Tasks remain available, but the project is hidden from active work.`)) return;
    try {
      await updateProject(project.id, { status: 'archived' });
      success('Project archived');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Archive failed');
    }
  };

  const removeProject = async (project) => {
    if (!window.confirm(`Delete ${project.name}? This cannot be undone.`)) return;
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
            <article
              key={project.id}
              className="feature-card group min-h-56 text-left"
            >
              <div className="mb-8 flex items-start justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--colors-surface-dark)] text-sm font-bold text-white focus-ring"
                  aria-label={`Open ${project.name}`}
                >
                  {(project.name || 'P').slice(0, 1).toUpperCase()}
                </button>
                <div className="flex items-center gap-2">
                  <span className="pill">{project.columns?.length || 0} columns</span>
                  {project.status === 'archived' && <span className="pill">Archived</span>}
                </div>
              </div>
              <button type="button" onClick={() => navigate(`/projects/${project.id}`)} className="text-left focus-ring">
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
              {canCreate && (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--colors-hairline)] pt-4">
                  <Button variant="utility" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>Open</Button>
                  <Button variant="utility" size="sm" onClick={() => openEdit(project)}>Edit</Button>
                  {project.status !== 'archived' && (
                    <Button variant="utility" size="sm" onClick={() => archiveProject(project)}>Archive</Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => removeProject(project)}>Delete</Button>
                </div>
              )}
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
              {role === ROLES.ADMIN && !activeWorkspaceId && workspaces.length > 0 && (
                <SelectField
                  label="Workspace"
                    name="workspaceId"
                    value={form.workspaceId}
                    onChange={handleChange}
                  error={errors.workspaceId}
                  selectClassName="h-12 bg-[var(--colors-canvas-softer)] px-4 pr-11"
                  >
                    <option value="">Select workspace...</option>
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </SelectField>
              )}
              <SelectField
                label="Workflow template"
                name="templateId"
                value={form.templateId}
                onChange={handleChange}
                selectClassName="h-12 bg-[var(--colors-canvas-softer)] px-4 pr-11"
              >
                  <option value="">Start from blank - Basic Kanban</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </SelectField>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
