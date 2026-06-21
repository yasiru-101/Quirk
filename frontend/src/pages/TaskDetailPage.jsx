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

  // ── Error state ──────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-sm font-semibold text-zinc-200">Task not found</h2>
        <p className="text-xs text-zinc-500 max-w-xs">The task could not be loaded. It may have been deleted or you may not have access.</p>
        <button onClick={() => navigate('/tasks')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
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

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 animate-in">
        <div className="skeleton h-8 w-1/2 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate);

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <button onClick={() => navigate('/tasks')} className="hover:text-zinc-300 transition-colors">
          Tasks
        </button>
        <span>/</span>
        <span className="text-zinc-400 truncate max-w-xs">{task.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {overdue && (
              <span className="text-[11px] font-medium text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full ring-1 ring-rose-400/20">
                ⚠ Overdue
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-zinc-100 leading-snug">{task.title}</h1>
          {task.description && (
            <p className="text-sm text-zinc-400 leading-relaxed">{task.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPM && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Status */}
        <div className="card p-4 space-y-1.5">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">Status</p>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer w-full ${getStatusColor(task.status)} bg-transparent`}
          >
            {TASK_STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Due date */}
        <div className="card p-4 space-y-1.5">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">Due Date</p>
          <p className={`text-sm font-semibold ${overdue ? 'text-rose-400' : 'text-zinc-100'}`}>
            {formatDate(task.dueDate)}
          </p>
        </div>

        {/* Created by */}
        <div className="card p-4 space-y-1.5">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">Created by</p>
          <p className="text-sm font-semibold text-zinc-100">{task.createdBy?.name ?? '—'}</p>
        </div>

        {/* Created at */}
        <div className="card p-4 space-y-1.5">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">Created</p>
          <p className="text-sm font-semibold text-zinc-100">{formatDate(task.createdAt)}</p>
        </div>
      </div>

      {/* Assignees */}
      {task.assignees?.length > 0 && (
        <div className="card p-5 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Assignees</p>
          <div className="flex flex-wrap gap-3">
            {task.assignees.map((u) => (
              <div key={u._id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold ring-1 ring-indigo-500/20">
                  {getInitials(u.name)}
                </div>
                <span className="text-xs text-zinc-200">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments & Attachments panel */}
      <div className="card p-5">
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
