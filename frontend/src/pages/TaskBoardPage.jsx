/**
 * @file TaskBoardPage.jsx
 * @description Task board layout supporting Kanban and list formats.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import Button from '../components/common/Button';
import ViewHeader from '../components/common/ViewHeader';
import ViewToolbar from '../components/common/ViewToolbar';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { cn, isOverdue } from '../utils/helpers';
import { ROLES } from '../utils/constants';

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
    <div className="flex flex-col h-full overflow-hidden animate-in">
      <ViewHeader 
        icon="✨"
        title="Task Board"
        subtitle="Manage and track your tasks."
        tabs={[
          { id: 'kanban', label: 'Board', icon: '⏸' },
          { id: 'table', label: 'List', icon: '📋' }
        ]}
        activeTab={view}
        onTabChange={setView}
      />

      <ViewToolbar 
        filters={[
          { id: 'status', label: 'Status', icon: '🏷️' },
          { id: 'assignee', label: 'Assignee', icon: '👤' }
        ]}
        activeFilters={['status']}
        actions={
          isPM && (
            <button 
              onClick={() => setModal({ open: true, task: null })}
              className="text-[var(--colors-ink-muted)] text-[12.5px] hover:text-[var(--colors-primary-active)] flex items-center gap-1 font-medium"
            >
              + Add Task
            </button>
          )
        }
      />

      <div className="flex-1 flex overflow-hidden bg-[var(--colors-canvas-soft)]">
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
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
        </div>
        <Outlet />
      </div>

      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, task: null })}
        task={modal.task}
        onSaved={handleSaved}
      />
    </div>
  );
}
