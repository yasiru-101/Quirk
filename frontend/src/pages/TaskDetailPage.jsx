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
import { useProject } from '../context/ProjectContext';
import { getPriorityColor, getStatusColor, getTaskColumnName, formatDate, getInitials, isOverdue } from '../utils/helpers';
import { ROLES } from '../utils/constants';
import { cn } from '../utils/helpers';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const { projects } = useProject();
  const isPM = role === ROLES.PROJECT_MANAGER;
  const columns = projects.flatMap((project) => (project.columns ?? []).map((column) => ({
    ...column,
    projectId: column.projectId || project.id,
  })));

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

  const handleColumnChange = async (columnId) => {
    const column = columns.find((c) => c.id === columnId);
    setTask((t) => ({ ...t, columnId, column: column || t.column }));
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
  const taskColumns = columns.filter((column) => column.projectId === task.projectId);
  const columnName = getTaskColumnName(task);

  return (
    <div id="detail-panel" className="w-[400px] flex-shrink-0 bg-[var(--surface)] border-l border-[var(--border)] flex flex-col h-full overflow-hidden transition-all duration-200 shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-20">
      
      {/* ── dp-header ── */}
      <div className="flex flex-col gap-3 p-5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider', getPriorityColor(task.priority))}>
              {task.priority} Priority
            </span>
            {overdue && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isPM && (
              <button onClick={() => setEditOpen(true)} className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-faint)] hover:text-[var(--text-primary)] transition-colors" title="Edit">
                ✏️
              </button>
            )}
            <button onClick={() => navigate('/tasks')} className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-faint)] hover:text-[var(--text-primary)] transition-colors" title="Close">
              ✕
            </button>
          </div>
        </div>

        <h2 className="text-[18px] font-bold text-[var(--text-primary)] leading-snug">{task.title}</h2>
        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <span>📅 {formatDate(task.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👤 {task.createdBy?.name || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── dp-body ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Description Section */}
        {task.description && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-faint)] p-3 rounded-lg border border-[var(--border)]">
              {task.description}
            </p>
          </div>
        )}

        {/* Column Dropdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Column</h3>
          <select
            value={task.columnId || ''}
            onChange={(e) => handleColumnChange(e.target.value)}
            className={cn('w-full text-sm font-bold px-3 py-2 rounded-lg border outline-none cursor-pointer appearance-none', getStatusColor(columnName))}
          >
            {taskColumns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
          </select>
        </div>

        {/* Assignees */}
        {task.assignees?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Assignees</h3>
            <div className="flex flex-col gap-2 bg-[var(--bg-faint)] p-3 rounded-lg border border-[var(--border)]">
              {task.assignees.map((u) => (
                <div key={u._id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-[10px] font-bold">
                    {getInitials(u.name)}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Panel */}
        <div className="space-y-2 pt-4 border-t border-[var(--border)]">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Activity</h3>
          <CommentsPanel taskId={task._id} />
        </div>

        {isPM && (
          <div className="pt-6 mt-6 border-t border-rose-100 dark:border-rose-900/30">
            <Button variant="danger" className="w-full text-sm" onClick={handleDelete}>
              Delete Task
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
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
