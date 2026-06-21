/**
 * @file TaskBoardPage.jsx
 * @description Task board layout supporting Kanban and list formats.
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

  useEffect(() => {
    setLoading(true);
    taskService
      .getTasks()
      .then(({ data }) => setTasks(data.tasks ?? []))
      .catch(() => toastError('Failed to load tasks. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = on('task:statusChanged', ({ taskId, status }) => {
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    });
    return unsub;
  }, [on]);

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

  const filtered = tasks.filter((t) => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status === 'Overdue') {
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
    } catch {}
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try {
      await taskService.deleteTask(taskId);
      success('Task deleted');
    } catch {
      toastError('Failed to delete task. Please try again.');
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
    <div className="space-y-6 animate-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--colors-hairline)] pb-6">
        <div>
          <h1 className="text-[var(--typography-display-sm)] font-bold text-[var(--colors-ink)]">Task Board</h1>
          <p className="text-[var(--typography-body-md)] text-[var(--colors-body)] mt-1.5">
            Plan, organize, and track all your tasks in one place.
          </p>
        </div>
        {isPM && (
          <Button variant="primary" onClick={() => setModal({ open: true, task: null })} className="w-full sm:w-auto h-11">
            + New Task
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <TaskFilters filters={filters} onChange={handleFilterChange} />

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center bg-[var(--colors-canvas-softer)] border border-[var(--colors-hairline)] rounded-lg p-1 shadow-sm">
            {[
              { id: 'kanban', icon: '⊞', label: 'Kanban' },
              { id: 'table',  icon: '≡', label: 'Table' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all',
                  view === id
                    ? 'bg-[var(--colors-canvas)] text-[var(--colors-ink)] shadow-sm border border-[var(--colors-hairline)]'
                    : 'text-[var(--colors-mute)] hover:text-[var(--colors-ink)] border border-transparent'
                )}
                aria-pressed={view === id}
              >
                <span aria-hidden>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold text-[var(--colors-mute)] uppercase tracking-widest">
        {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
        {filters.status === 'Overdue' ? ' overdue' : (filters.search || filters.status || filters.priority) ? ' (filtered)' : ''}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-80 rounded-xl" />
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

      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, task: null })}
        task={modal.task}
        onSaved={handleSaved}
      />
    </div>
  );
}
