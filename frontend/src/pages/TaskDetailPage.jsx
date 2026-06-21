/**
 * @file TaskDetailPage.jsx
 * @description Detailed workspace screen showing task specifications, comments, and attachments.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CommentsPanel from '../components/tasks/CommentsPanel';
import Button from '../components/common/Button';
import TaskModal from '../components/tasks/TaskModal';
import { getPriorityColor, getStatusColor, formatDate, getInitials, isOverdue } from '../utils/helpers';
import { ROLES, TASK_STATUS_LIST } from '../utils/constants';
import { cn } from '../utils/helpers';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const isPM = role === ROLES.PROJECT_MANAGER;

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

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-sm font-bold text-[var(--colors-ink)]">Task not found</h2>
        <p className="text-xs text-[var(--colors-body)] max-w-xs">The task could not be loaded. It may have been deleted or you may not have access.</p>
        <button onClick={() => navigate('/tasks')} className="text-xs font-semibold text-[var(--colors-primary)] hover:text-[var(--colors-primary-deep)] transition-colors underline underline-offset-2">
          ← Back to tasks
        </button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus) => {
    setTask((t) => ({ ...t, status: newStatus }));
    try {
      await taskService.updateTaskStatus(id, newStatus);
    } catch {
      toastError('Failed to update status.');
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

  const handleSaved = (saved) => setTask(saved);

  if (loading) {
    return (
      <div className="space-y-6 animate-in max-w-5xl mx-auto">
        <div className="skeleton h-10 w-1/2 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate);

  return (
    <div className="space-y-8 animate-in max-w-5xl mx-auto pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--colors-mute)]">
        <button onClick={() => navigate('/tasks')} className="hover:text-[var(--colors-ink)] transition-colors">
          Tasks
        </button>
        <span>/</span>
        <span className="text-[var(--colors-body)] truncate max-w-xs">{task.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', getPriorityColor(task.priority))}>
              {task.priority} Priority
            </span>
            {overdue && (
              <span className="text-[11px] font-bold text-[var(--colors-priority-urgent)] bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                ⚠ Overdue
              </span>
            )}
          </div>
          <h1 className="text-[var(--typography-display-md)] font-bold text-[var(--colors-ink)] leading-tight">{task.title}</h1>
          {task.description && (
            <p className="text-[var(--typography-body-lg)] text-[var(--colors-body)] leading-relaxed max-w-3xl">{task.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isPM && (
            <>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                Edit Task
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status */}
        <div className="card p-5 space-y-2">
          <p className="text-[11px] font-bold text-[var(--colors-mute)] uppercase tracking-widest">Status</p>
          <div className="relative">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={cn('text-sm font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer w-full appearance-none', getStatusColor(task.status))}
            >
              {TASK_STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Due date */}
        <div className="card p-5 space-y-2">
          <p className="text-[11px] font-bold text-[var(--colors-mute)] uppercase tracking-widest">Due Date</p>
          <p className={cn('text-sm font-bold', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-ink)]')}>
            {formatDate(task.dueDate)}
          </p>
        </div>

        {/* Created by */}
        <div className="card p-5 space-y-2">
          <p className="text-[11px] font-bold text-[var(--colors-mute)] uppercase tracking-widest">Created By</p>
          <p className="text-sm font-bold text-[var(--colors-ink)] truncate">{task.createdBy?.name ?? '—'}</p>
        </div>

        {/* Created at */}
        <div className="card p-5 space-y-2">
          <p className="text-[11px] font-bold text-[var(--colors-mute)] uppercase tracking-widest">Created At</p>
          <p className="text-sm font-bold text-[var(--colors-ink)]">{formatDate(task.createdAt)}</p>
        </div>
      </div>

      {/* Assignees */}
      {task.assignees?.length > 0 && (
        <div className="card p-6 space-y-4">
          <p className="text-[11px] font-bold text-[var(--colors-mute)] uppercase tracking-widest border-b border-[var(--colors-hairline)] pb-2">Assignees</p>
          <div className="flex flex-wrap gap-4 pt-2">
            {task.assignees.map((u) => (
              <div key={u._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--colors-primary-glow)] text-[var(--colors-primary-deep)] flex items-center justify-center text-[11px] font-bold ring-1 ring-[var(--colors-primary)]">
                  {getInitials(u.name)}
                </div>
                <span className="text-sm font-bold text-[var(--colors-ink)]">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments & Attachments panel */}
      <div className="card p-6">
        <CommentsPanel taskId={task._id} />
      </div>

      {/* Edit modal (PM only) */}
      {isPM && (
        <TaskModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          task={task}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
