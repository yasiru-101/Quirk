/**
 * @file ProjectDetailPage.jsx
 * @description Project scoped overview.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import SelectField from '../components/common/SelectField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { normalizeError } from '../services/api';
import { ROLES } from '../utils/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    setActiveProject,
    workspaceMembers,
    canManageWorkspace,
    refreshProjects,
    addProjectMember,
    removeProjectMember,
  } = useProject();
  const { role, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'Collaborator' });
  const [columnDrafts, setColumnDrafts] = useState({});
  const [newColumnName, setNewColumnName] = useState('');
  const [savingColumn, setSavingColumn] = useState(null);
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

  useEffect(() => {
    if (!project) return;
    setColumnDrafts(Object.fromEntries((project.columns ?? []).map((column) => [column.id, column.name])));
  }, [project]);

  const saveColumn = async (column) => {
    const nextName = columnDrafts[column.id]?.trim();
    if (!nextName || nextName === column.name) return;
    setSavingColumn(column.id);
    try {
      await api.put(`/projects/${project.id}/columns/${column.id}`, { name: nextName, order: column.order });
      await refreshProjects();
      success('Workflow column updated');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Column update failed');
    } finally {
      setSavingColumn(null);
    }
  };

  const moveColumn = async (column, direction) => {
    const columns = [...(project.columns ?? [])].sort((a, b) => a.order - b.order);
    const index = columns.findIndex((item) => item.id === column.id);
    const swapWith = columns[index + direction];
    if (!swapWith) return;
    setSavingColumn(column.id);
    try {
      await Promise.all([
        api.put(`/projects/${project.id}/columns/${column.id}`, { order: swapWith.order }),
        api.put(`/projects/${project.id}/columns/${swapWith.id}`, { order: column.order }),
      ]);
      await refreshProjects();
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Column reorder failed');
    } finally {
      setSavingColumn(null);
    }
  };

  const addColumn = async (event) => {
    event.preventDefault();
    const name = newColumnName.trim();
    if (!name) return;
    setSavingColumn('new');
    try {
      await api.post(`/projects/${project.id}/columns`, { name });
      setNewColumnName('');
      await refreshProjects();
      success('Workflow column added');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Column create failed');
    } finally {
      setSavingColumn(null);
    }
  };

  const deleteColumn = async (column) => {
    if (!window.confirm(`Delete "${column.name}"? Tasks in this column will become unassigned.`)) return;
    setSavingColumn(column.id);
    try {
      await api.delete(`/projects/${project.id}/columns/${column.id}`);
      await refreshProjects();
      success('Workflow column deleted');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Column delete failed');
    } finally {
      setSavingColumn(null);
    }
  };

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
        <div className="flex flex-col gap-3">
          {(project.columns ?? []).map((column, index) => (
            <div key={column.id} className="flex flex-col md:flex-row md:items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
              {isPM ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      value={columnDrafts[column.id] ?? column.name}
                      onChange={(event) => setColumnDrafts((current) => ({ ...current, [column.id]: event.target.value }))}
                      onBlur={() => saveColumn(column)}
                      className="h-10 text-sm w-full"
                      aria-label={`Rename ${column.name}`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={index === 0 || savingColumn === column.id} onClick={() => moveColumn(column, -1)} className="p-1.5 text-[var(--colors-mute)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button type="button" disabled={index === (project.columns?.length ?? 1) - 1 || savingColumn === column.id} onClick={() => moveColumn(column, 1)} className="p-1.5 text-[var(--colors-mute)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="w-px h-4 bg-[var(--colors-hairline)] mx-1" />
                    <button type="button" disabled={(project.columns?.length ?? 0) <= 1 || savingColumn === column.id} onClick={() => deleteColumn(column)} className="p-1.5 text-[var(--colors-priority-urgent)] opacity-70 hover:opacity-100 hover:bg-[var(--colors-priority-urgent)]/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Delete column">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="font-semibold text-[var(--colors-ink)] flex-1">{column.name}</p>
              )}
              <p className="text-sm text-[var(--colors-body)] hidden md:block">Tasks in this column inherit this workflow state.</p>
            </div>
          ))}
        </div>
        {isPM && (
          <form onSubmit={addColumn} className="mt-5 flex flex-col gap-3 border-t border-[var(--colors-hairline)] pt-5 sm:flex-row">
            <Input
              value={newColumnName}
              onChange={(event) => setNewColumnName(event.target.value)}
              placeholder="Add workflow column"
              className="h-11"
            />
            <Button type="submit" variant="primary" disabled={!newColumnName.trim() || savingColumn === 'new'}>
              Add column
            </Button>
          </form>
        )}
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
                await refreshProjects();
                success('Member assigned');
              } catch (err) {
                const { message } = normalizeError(err);
                toastError(message, 'Assign failed');
              }
            }}
          >
            <SelectField
              value={memberForm.userId}
              onChange={(event) => setMemberForm((current) => ({ ...current, userId: event.target.value }))}
              selectClassName="bg-[var(--colors-canvas)]"
            >
              <option value="">Select workspace member</option>
              {assignableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>{member.user?.name} ({member.user?.email})</option>
              ))}
            </SelectField>
            <SelectField
              value={memberForm.role}
              onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}
              selectClassName="bg-[var(--colors-canvas)]"
            >
              <option>Collaborator</option>
              <option>Project Manager</option>
            </SelectField>
            <Button type="submit" variant="primary" disabled={!memberForm.userId}>Add member</Button>
          </form>
        )}
      </section>
    </div>
  );
}
