/**
 * @file TaskBoardPage.jsx
 * @description Task board layout supporting Kanban, list, calendar, and timeline views.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskTable from '../components/tasks/TaskTable';
import TaskCalendarView from '../components/tasks/TaskCalendarView';
import TaskTimelineView from '../components/tasks/TaskTimelineView';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import ViewHeader from '../components/common/ViewHeader';
import ViewToolbar from '../components/common/ViewToolbar';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useProject } from '../context/ProjectContext';
import { getTaskColumnName, isOverdue, isTerminalColumn } from '../utils/helpers';
import { ROLES } from '../utils/constants';

export default function TaskBoardPage() {
  const { role, user } = useAuth();
  const { error: toastError, success } = useToast();
  const { on } = useSocket();
  const { projects, loading: projectsLoading, canManageWorkspace } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const scopedProjectId = new URLSearchParams(location.search).get('projectId') || '';
  const scopedProject = useMemo(
    () => projects.find((project) => project.id === scopedProjectId),
    [projects, scopedProjectId]
  );

  const visibleProjects = useMemo(
    () => (scopedProject ? [scopedProject] : projects),
    [projects, scopedProject]
  );

  const canManageProject = (project) =>
    role === ROLES.ADMIN ||
    canManageWorkspace ||
    project?.members?.some((member) => (member.userId === user?.id || member.user?.id === user?.id) && member.role === ROLES.PROJECT_MANAGER);

  const canCreateTask = visibleProjects.some(canManageProject);

  const [view, setView] = useState('kanban');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', columnId: '', priority: '' });
  const [modal, setModal] = useState({ open: false, task: null });

  const columns = useMemo(
    () => visibleProjects.flatMap((project) => (project.columns ?? []).map((column) => ({
      ...column,
      projectId: column.projectId || project.id,
      projectName: project.name,
    }))),
    [visibleProjects]
  );

  const columnsById = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns]
  );

  useEffect(() => {
    setLoading(true);
    taskService
      .getTasks(scopedProjectId ? { projectId: scopedProjectId } : {})
      .then(({ data }) => setTasks(data.tasks ?? []))
      .catch(() => toastError('Failed to load tasks. Please refresh.'))
      .finally(() => setLoading(false));
  }, [scopedProjectId, toastError]);

  useEffect(() => {
    const openCreateModal = () => setModal({ open: true, task: null });
    window.addEventListener('task:create', openCreateModal);
    return () => window.removeEventListener('task:create', openCreateModal);
  }, []);

  useEffect(() => {
    if (!location.state?.createTask) return;
    setModal({ open: true, task: null });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state?.createTask, navigate]);

  useEffect(() => {
    const unsub = on('task:columnChanged', ({ taskId, columnId }) => {
      const column = columnsById.get(columnId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, columnId, column: column || t.column } : t)));
    });
    return unsub;
  }, [on, columnsById]);

  useEffect(() => {
    const unsub = on('task:assigned', (newTask) => {
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === newTask._id);
        return exists ? prev : [newTask, ...prev];
      });
    });
    return unsub;
  }, [on]);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const filtered = tasks.filter((task) => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.columnId === 'Overdue') {
      if (!isOverdue(task.dueDate) || isTerminalColumn(getTaskColumnName(task))) return false;
    } else if (filters.columnId && task.columnId !== filters.columnId) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    return true;
  });

  const handleColumnChange = async (taskId, columnId) => {
    const column = columnsById.get(columnId);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, columnId, column: column || t.column } : t)));
    try {
      const { data } = await taskService.updateTaskColumn(taskId, columnId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    } catch {
      toastError('Failed to move task. Please try again.');
    }
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
    <div className="flex h-full flex-col overflow-hidden animate-in">
      <ViewHeader
        title="Task Board"
        subtitle={scopedProject ? `Project-specific tasks for ${scopedProject.name}.` : 'Manage work across board, list, calendar, and timeline views.'}
        tabs={[
          { id: 'kanban', label: 'Board' },
          { id: 'table', label: 'List' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'timeline', label: 'Timeline' },
        ]}
        activeTab={view}
        onTabChange={setView}
      />

      <ViewToolbar
        filters={[
          { id: 'column', label: 'Column' },
          { id: 'assignee', label: 'Assignee' },
        ]}
        activeFilters={['column']}
        actions={
          canCreateTask && (
            <button
              onClick={() => setModal({ open: true, task: null })}
              className="rounded-full bg-[var(--colors-primary)] px-4 py-2 text-[13px] font-semibold text-[var(--colors-on-primary)] transition hover:bg-[var(--colors-primary-hover)] focus-ring"
            >
              Add task
            </button>
          )
        }
      />

      <div className="flex flex-1 overflow-hidden bg-[var(--colors-canvas-soft)]">
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <TaskFilters filters={filters} columns={columns} onChange={handleFilterChange} />
          {loading || projectsLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-[var(--radius-xl)] bg-[var(--colors-surface-pressed)]" />
              ))}
            </div>
          ) : view === 'kanban' ? (
            <KanbanBoard
              tasks={filtered}
              columns={columns}
              canManageTasks={canCreateTask}
              onColumnChange={handleColumnChange}
              onCardClick={(task) => navigate(`/tasks/${task._id}`)}
              onDelete={handleDelete}
            />
          ) : view === 'table' ? (
            <TaskTable
              tasks={filtered}
              columns={columns}
              canManageTasks={canCreateTask}
              onEdit={(task) => setModal({ open: true, task })}
              onDelete={handleDelete}
              onColumnChange={handleColumnChange}
              onCreateNew={() => setModal({ open: true, task: null })}
            />
          ) : view === 'calendar' ? (
            <TaskCalendarView
              tasks={filtered}
              onTaskClick={(task) => setModal({ open: true, task })}
            />
          ) : (
            <TaskTimelineView
              tasks={filtered}
              columns={columns}
              onTaskClick={(task) => setModal({ open: true, task })}
            />
          )}
        </div>
        <Outlet />
      </div>

      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, task: null })}
        task={modal.task}
        projects={visibleProjects}
        columns={columns}
        onSaved={handleSaved}
      />
    </div>
  );
}
