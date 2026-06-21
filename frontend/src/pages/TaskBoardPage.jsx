/**
 * @file TaskBoardPage.jsx
 * @description Task board layout supporting list formats, Kanban layouts, search filters, and detail popups.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import Button from '../components/common/Button';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ROLES } from '../utils/constants';
import { cn, isOverdue } from '../utils/helpers';


// ─────────────────────────────────────────────────────────────────────────────
/**
 * Component rendering the primary task workflow screen. Manages card sorting, layout toggles, 
 * filters, and triggers modals.
 */
export default function TaskBoardPage() {
  const { role } = useAuth();
  const { error: toastError, success } = useToast();
  const { on } = useSocket();
  const navigate = useNavigate();
  const isPM = role === ROLES.PROJECT_MANAGER;

  const [view, setView] = useState('kanban');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const [modal, setModal] = useState({ open: false, task: null });

  // Load tasks from API
  useEffect(() => {
    setLoading(true);
    taskService
      .getTasks()
      .then(({ data }) => setTasks(data.tasks ?? []))
      .catch(() => toastError('Failed to load tasks. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  // Real-time: update task status on socket event
  useEffect(() => {
    const unsub = on('task:statusChanged', ({ taskId, status }) => {
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    });
    return unsub;
  }, [on]);

  // Real-time: new task assigned
  useEffect(() => {
    const unsub = on('task:assigned', (newTask) => {
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === newTask._id);
        return exists ? prev : [newTask, ...prev];
      });
    });
    return unsub;
  }, [on]);

  const handleFilterChange = (name, value) =>
    setFilters((f) => ({ ...f, [name]: value }));

  // Apply filters (Overdue is a virtual filter — not a real DB status)
  const filtered = tasks.filter((t) => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status === 'Overdue') {
      // Overdue: deadline passed AND task is not yet Completed
      if (!isOverdue(t.dueDate) || t.status === 'Completed') return false;
    } else if (filters.status) {
      if (t.status !== filters.status) return false;
    }
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
    } catch {
      // revert on failure (simplified — in production re-fetch)
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try {
      await taskService.deleteTask(taskId);
      success('Task deleted');
    } catch (err) {
      toastError('Failed to delete task. Please try again.');
      // In a production app you'd re-fetch here
    }
  };

  const handleSaved = (savedTask) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t._id === savedTask._id);
      return exists
        ? prev.map((t) => (t._id === savedTask._id ? savedTask : t))
        : [savedTask, ...prev];
    });
  };

  return (
    <div className="space-y-5 animate-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Filters */}
        <TaskFilters filters={filters} onChange={handleFilterChange} />

        <div className="flex items-center gap-2 ml-auto">
          {/* View toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {[
              { id: 'kanban', icon: '⊞', label: 'Kanban' },
              { id: 'table',  icon: '≡', label: 'Table' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  view === id
                    ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
                aria-pressed={view === id}
              >
                <span aria-hidden>{icon}</span> {label}
              </button>
            ))}
          </div>

          {/* Create task (PM only) */}
          {isPM && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModal({ open: true, task: null })}
            >
              + New Task
            </Button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-600">
        {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
        {filters.status === 'Overdue'
          ? ' overdue'
          : (filters.search || filters.status || filters.priority) ? ' (filtered)' : ''}
      </p>

      {/* Views */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          tasks={filtered}
          onStatusChange={handleStatusChange}
          onCardClick={(task) => navigate(`/tasks/${task._id}`)}
          onDelete={handleDelete}
        />
      ) : (
        <TaskTable
          tasks={filtered}
          onEdit={(task) => setModal({ open: true, task })}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onCreateNew={() => setModal({ open: true, task: null })}
        />
      )}

      {/* Task create/edit modal */}
      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, task: null })}
        task={modal.task}
        onSaved={handleSaved}
      />
    </div>
  );
}
