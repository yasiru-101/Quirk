/**
 * @file TaskDetailPage.jsx
 * @description Detailed task side panel with column, assignee, activity, and task controls.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CommentsPanel from '../components/tasks/CommentsPanel';
import Button from '../components/common/Button';
import TaskModal from '../components/tasks/TaskModal';
import { useProject } from '../context/ProjectContext';
import { getPriorityColor, getStatusColor, getTaskColumnName, formatDate, getInitials, isOverdue, cn } from '../utils/helpers';
import { ROLES } from '../utils/constants';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const { projects } = useProject();
  const isPM = role === ROLES.PROJECT_MANAGER;

  const columns = useMemo(
    () => projects.flatMap((project) => (project.columns ?? []).map((column) => ({
      ...column,
      projectId: column.projectId || project.id,
    }))),
    [projects]
  );

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    taskService
      .getTask(id)
      .then(({ data }) => setTask(data.task))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleColumnChange = async (columnId) => {
    const column = columns.find((item) => item.id === columnId);
    setTask((current) => ({ ...current, columnId, column: column || current.column }));
    try {
      const { data } = await taskService.updateTaskColumn(id, columnId);
      setTask(data.task);
    } catch {
      toastError('Failed to move task.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await taskService.deleteTask(id);
      success('Task deleted');
      navigate('/tasks');
    } catch {
      toastError('Failed to delete task.');
    }
  };

  if (fetchError) {
    return (
      <aside id="detail-panel">
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Task not found</h2>
          <p className="mt-2 max-w-xs text-sm text-[var(--colors-body)]">The task could not be loaded. It may have been deleted or you may not have access.</p>
          <Button variant="secondary" size="sm" className="mt-6" onClick={() => navigate('/tasks')}>
            Back to tasks
          </Button>
        </div>
      </aside>
    );
  }

  if (loading) {
    return (
      <aside id="detail-panel">
        <div className="space-y-4 p-5">
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-[var(--colors-surface-pressed)]" />
          <div className="h-4 w-full animate-pulse rounded-full bg-[var(--colors-surface-pressed)]" />
          <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-[var(--colors-surface-pressed)]" />
        </div>
      </aside>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate);
  const taskColumns = columns.filter((column) => column.projectId === task.projectId);
  const columnName = getTaskColumnName(task);

  return (
    <aside id="detail-panel" className="shadow-[-18px_0_45px_rgba(10,11,13,0.08)]">
      <div className="flex shrink-0 flex-col gap-4 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', getPriorityColor(task.priority))}>
              {task.priority}
            </span>
            {overdue && (
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-[var(--colors-priority-urgent)] dark:border-red-900/60 dark:bg-red-950/30">
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isPM && (
              <button
                onClick={() => setEditOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-canvas-soft)] hover:text-[var(--colors-ink)] focus-ring"
                title="Edit"
                aria-label="Edit task"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate('/tasks')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-canvas-soft)] hover:text-[var(--colors-ink)] focus-ring"
              title="Close"
              aria-label="Close task details"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <h2 className="text-[length:var(--typography-title)] font-semibold leading-snug text-[var(--colors-ink)]">{task.title}</h2>
        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[var(--colors-ink-muted)]">
          <div className="rounded-[var(--radius-lg)] bg-[var(--colors-canvas-soft)] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-[var(--colors-ink-faint)]">Due</p>
            <p>{formatDate(task.dueDate)}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--colors-canvas-soft)] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-[var(--colors-ink-faint)]">Created by</p>
            <p>{task.createdBy?.name || 'Unassigned'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {task.description && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Description</h3>
            <p className="rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4 text-sm leading-relaxed text-[var(--colors-ink)]">
              {task.description}
            </p>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Column</h3>
          <select
            value={task.columnId || ''}
            onChange={(event) => handleColumnChange(event.target.value)}
            className={cn('w-full cursor-pointer appearance-none rounded-full border px-4 py-2.5 text-sm font-bold outline-none focus-ring', getStatusColor(columnName))}
          >
            {taskColumns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
          </select>
        </section>

        {task.assignees?.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Assignees</h3>
            <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-3">
              {task.assignees.map((user) => (
                <div key={user._id} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--colors-surface-dark)] text-[10px] font-bold text-white">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-semibold text-[var(--colors-ink)]">{user.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2 border-t border-[var(--colors-hairline)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Activity</h3>
          <CommentsPanel taskId={task._id} />
        </section>

        {isPM && (
          <div className="border-t border-red-100 pt-5 dark:border-red-900/30">
            <Button variant="danger" className="w-full text-sm" onClick={handleDelete}>
              Delete task
            </Button>
          </div>
        )}
      </div>

      {isPM && (
        <TaskModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          task={task}
          projects={projects}
          columns={columns}
          onSaved={setTask}
        />
      )}
    </aside>
  );
}
