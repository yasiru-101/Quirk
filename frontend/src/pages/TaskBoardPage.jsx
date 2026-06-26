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
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useProject } from '../context/ProjectContext';
import { getTaskColumnName, isOverdue, isTerminalColumn } from '../utils/helpers';
import { ROLES } from '../utils/constants';

export default function TaskBoardPage() {
  const { user, isPlatformAdmin } = useAuth();
  const { error: toastError, success } = useToast();
  const confirm = useConfirm();
  const { on } = useSocket();
  const { projects, loading: projectsLoading, canManageWorkspace } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const scopedProjectId = new URLSearchParams(location.search).get('projectId') || '';
  const scopedProject = useMemo(
    () => projects.find((project) => project.id === scopedProjectId),
    [projects, scopedProjectId]
  );

  // There is no general task board — tasks are viewed inside a project. The bare
  // /tasks route (no project, not a task-detail deep link) redirects to Projects.
  const viewingDetail = /^\/tasks\/[^/]+$/.test(location.pathname);
  useEffect(() => {
    if (!scopedProjectId && !viewingDetail) {
      navigate('/projects', { replace: true });
    }
  }, [scopedProjectId, viewingDetail, navigate]);

  const visibleProjects = useMemo(
    () => (scopedProject ? [scopedProject] : projects),
    [projects, scopedProject]
  );

  const canManageProject = (project) =>
    isPlatformAdmin ||
    canManageWorkspace ||
    project?.members?.some((member) => (member.userId === user?.id || member.user?.id === user?.id) && member.role === ROLES.PROJECT_MANAGER);

  const canCreateTask = visibleProjects.some(canManageProject);

  const [view, setView] = useState('kanban');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', columnId: '', assigneeId: '', priority: '', sortBy: 'Newest First' });
  const [modal, setModal] = useState({ open: false, task: null });

  const columns = useMemo(() => {
    const map = new Map();
    visibleProjects.forEach((project) => {
      (project.columns ?? []).forEach((column) => {
        map.set(column.id, {
          ...column,
          projectId: column.projectId || project.id,
          projectName: project.name,
        });
      });
    });
    // Fall back to columns embedded in the tasks themselves so the board and
    // table still render lanes/options when the projects context hasn't supplied
    // columns (e.g. no active workspace yet). Tasks carry full column metadata.
    tasks.forEach((task) => {
      if (task.column && !map.has(task.column.id)) {
        map.set(task.column.id, {
          ...task.column,
          projectId: task.column.projectId || task.projectId,
          projectName: task.projectName || task.project?.name,
        });
      }
    });
    return [...map.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [visibleProjects, tasks]);

  const columnsById = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns]
  );

  const assignees = useMemo(() => {
    const users = new Map();
    visibleProjects.forEach((project) => {
      (project.members ?? []).forEach((member) => {
        const memberUser = member.user;
        const id = member.userId || memberUser?._id || memberUser?.id;
        if (id && memberUser) users.set(id, { ...memberUser, id });
      });
    });
    tasks.forEach((task) => {
      (task.assignees ?? []).forEach((memberUser) => {
        const id = memberUser._id || memberUser.id;
        if (id) users.set(id, { ...memberUser, id });
      });
    });
    return [...users.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [tasks, visibleProjects]);

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

  const filtered = useMemo(() => tasks.filter((task) => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.columnId === 'Overdue') {
      if (!isOverdue(task.dueDate) || isTerminalColumn(getTaskColumnName(task))) return false;
    } else if (filters.columnId && task.columnId !== filters.columnId) {
      return false;
    }
    if (filters.assigneeId && !(task.assignees ?? []).some((assignee) => (assignee._id || assignee.id) === filters.assigneeId)) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    return true;
  }), [tasks, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'Oldest First':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'Highest Priority': {
          const w = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return (w[b.priority] || 0) - (w[a.priority] || 0);
        }
        case 'Lowest Priority': {
          const w = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return (w[a.priority] || 0) - (w[b.priority] || 0);
        }
        case 'Due Date (Earliest)':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'Due Date (Latest)':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate) - new Date(a.dueDate);
        case 'Newest First':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [filtered, filters.sortBy]);

  const handleColumnChange = async (taskId, columnId) => {
    const column = columnsById.get(columnId);
    const previous = tasks.find((t) => t._id === taskId);
    if (previous?.columnId === columnId) return;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, columnId, column: column || t.column } : t)));
    try {
      const { data } = await taskService.updateTaskColumn(taskId, columnId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
      success(`Moved "${data.task?.title ?? previous?.title ?? 'task'}" to ${column?.name ?? 'new column'}`);
    } catch {
      // Roll back the optimistic move so the board reflects the true state.
      setTasks((prev) => prev.map((t) => (t._id === taskId && previous ? previous : t)));
      toastError('Failed to move task. Please try again.');
    }
  };

  // Toggle a task between its project's terminal column (Done/Completed) and the
  // first open column. Used by the timeline's inline complete control.
  const handleToggleComplete = (task) => {
    const projectId = task.column?.projectId || task.projectId;
    const projectColumns = columns.filter((c) => (c.projectId || projectId) === projectId);
    const pool = projectColumns.length ? projectColumns : columns;
    const done = isTerminalColumn(getTaskColumnName(task));
    const target = done
      ? pool.find((c) => !isTerminalColumn(c.name)) || pool[0]
      : pool.find((c) => isTerminalColumn(c.name)) || pool[pool.length - 1];
    if (target && target.id !== task.columnId) handleColumnChange(task._id, target.id);
  };

  const handleDelete = async (taskId) => {
    const ok = await confirm({
      title: 'Delete task',
      message: 'Delete this task? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
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

  const displayColumns = useMemo(() => {
    if (filters.columnId && filters.columnId !== 'Overdue') {
      return columns.filter(c => c.id === filters.columnId);
    }
    return columns;
  }, [columns, filters.columnId]);

  // List/table is the only view that page-scrolls naturally.
  // Kanban, calendar and timeline all need a fixed height context so their
  // internal scroll containers work correctly.
  const isTableView = view === 'table';

  return (
    <div className={`flex flex-col animate-in${isTableView ? ' min-h-full' : ' h-full overflow-hidden'}`}>
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

      <div className={`flex bg-[var(--colors-canvas-soft)]${isTableView ? ' flex-1' : ' flex-1 overflow-hidden'}`}>
        <div className={`flex flex-1 flex-col p-6${isTableView ? '' : ' overflow-hidden'}`}>
          <TaskFilters filters={filters} columns={columns} assignees={assignees} onChange={handleFilterChange} />
          <div className={isTableView ? 'mt-4' : 'min-h-0 flex-1 overflow-hidden'}>
          {loading || projectsLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-[var(--radius-xl)] bg-[var(--colors-surface-pressed)]" />
              ))}
            </div>
          ) : view === 'kanban' ? (
            <KanbanBoard
              tasks={sorted}
              columns={displayColumns}
              canManageTasks={canCreateTask}
              onColumnChange={handleColumnChange}
              onCardClick={(task) => setModal({ open: true, task })}
              onDelete={handleDelete}
            />
          ) : view === 'table' ? (
            <TaskTable
              tasks={sorted}
              columns={columns}
              canManageTasks={canCreateTask}
              onOpen={(task) => setModal({ open: true, task })}
              onEdit={(task) => setModal({ open: true, task })}
              onDelete={handleDelete}
              onColumnChange={handleColumnChange}
              onCreateNew={() => setModal({ open: true, task: null })}
            />
          ) : view === 'calendar' ? (
            <TaskCalendarView
              tasks={sorted}
              onTaskClick={(task) => setModal({ open: true, task })}
            />
          ) : (
            <TaskTimelineView
              tasks={sorted}
              columns={columns}
              onTaskClick={(task) => setModal({ open: true, task })}
              onMarkComplete={handleToggleComplete}
            />
          )}
          </div>
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
