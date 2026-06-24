/**
 * @file DashboardPage.jsx
 * @description Operational overview for every role. Shows headline task metrics,
 * a clickable task table, and a "needs attention" list. Clicking any task opens
 * the task modal. Admins additionally see a platform user strip. All task signals
 * are derived from the shared task query API (utils/analytics) — no per-view
 * endpoints (ADR 0005).
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import TaskModal from '../components/tasks/TaskModal';
import { ROLES } from '../utils/constants';
import { formatDate, getTaskColumnName, isOverdue, isTerminalColumn, cn } from '../utils/helpers';
import { computeTaskMetrics, computeRiskTasks } from '../utils/analytics';

function StatCard({ label, value, loading, accent }) {
  return (
    <div className="feature-card flex h-32 flex-col justify-between transition-all hover:border-[var(--colors-surface-pressed)]">
      <p className="text-[length:var(--typography-caption)] font-medium uppercase tracking-widest text-[color:var(--colors-ink-muted)]">{label}</p>
      {loading ? (
        <div className="mt-2 h-10 w-16 animate-pulse rounded bg-[var(--colors-canvas-soft)]" />
      ) : (
        <p className={cn(
          'text-[length:var(--typography-heading-1)] font-bold leading-none tabular-nums tracking-[var(--letter-spacing-heading-1)]',
          accent ? 'text-[var(--colors-priority-urgent)]' : 'text-[color:var(--colors-ink)]'
        )}>
          {value}
        </p>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { projects } = useProject();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskModal, setTaskModal] = useState({ open: false, task: null });

  const columns = useMemo(
    () => projects.flatMap((project) => (project.columns ?? []).map((column) => ({
      ...column,
      projectId: column.projectId || project.id,
      projectName: project.name,
    }))),
    [projects]
  );

  // Every role gets task analytics; the task query API already scopes results to
  // what the caller can access.
  useEffect(() => {
    setLoadingTasks(true);
    taskService.getTasks()
      .then(({ data }) => setTasks(data.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  }, []);

  // Admins also manage users platform-wide.
  useEffect(() => {
    if (role !== ROLES.ADMIN) return;
    userService.getUsers()
      .then(({ data }) => {
        const users = data.users ?? [];
        setUserStats({
          total: users.length,
          active: users.filter((u) => u.isActive).length,
          pending: users.filter((u) => u.mustResetPassword && u.isActive).length,
        });
      })
      .catch(() => setUserStats(null));
  }, [role]);

  const metrics = useMemo(() => computeTaskMetrics(tasks), [tasks]);
  const riskTasks = useMemo(() => computeRiskTasks(tasks, 5), [tasks]);
  const recentTasks = useMemo(
    () => [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 8),
    [tasks]
  );

  const isCollaborator = role === ROLES.COLLABORATOR;
  const statCards = [
    { label: isCollaborator ? 'My Tasks' : 'Total Tasks', value: metrics.total },
    { label: 'Completion', value: `${metrics.completionRate}%` },
    { label: 'Overdue', value: metrics.overdue, accent: metrics.overdue > 0 },
    { label: 'Due in 7 days', value: metrics.dueSoon },
  ];

  const openTask = (task) => setTaskModal({ open: true, task });

  return (
    <div className="page-shell animate-in space-y-10">
      <header className="space-y-2">
        <h1 className="text-[length:var(--typography-heading-1)] font-bold tracking-[var(--letter-spacing-heading-1)] text-[color:var(--colors-ink)]">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-[length:var(--typography-body-md)] text-[color:var(--colors-ink-muted)]">
          Here's an overview of your work today.
        </p>
      </header>

      {/* Headline task metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((s) => <StatCard key={s.label} {...s} loading={loadingTasks} />)}
      </div>

      {/* Admin platform strip */}
      {role === ROLES.ADMIN && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-5 py-4">
          <span className="text-sm font-semibold text-[var(--colors-ink)]">Platform</span>
          <span className="text-sm text-[var(--colors-body)]">Users: <b className="text-[var(--colors-ink)]">{userStats?.total ?? '—'}</b></span>
          <span className="text-sm text-[var(--colors-body)]">Active: <b className="text-[var(--colors-ink)]">{userStats?.active ?? '—'}</b></span>
          <span className="text-sm text-[var(--colors-body)]">Pending resets: <b className="text-[var(--colors-ink)]">{userStats?.pending ?? '—'}</b></span>
          <button className="ml-auto text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/users')}>
            Manage users →
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-4 border-b border-[var(--colors-hairline)] py-2">
        <p className="text-sm font-medium text-[color:var(--colors-ink-muted)]">Quick actions:</p>
        {role !== ROLES.COLLABORATOR && (
          <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/tasks', { state: { createTask: Date.now() } })}>+ New Task</button>
        )}
        {role !== ROLES.COLLABORATOR && (
          <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/projects')}>+ New Project</button>
        )}
        <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/tasks')}>View board</button>
        {role !== ROLES.COLLABORATOR && (
          <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/analytics')}>Analytics</button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent tasks table */}
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Recent tasks</h2>
          {loadingTasks ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-[var(--colors-canvas-soft)]" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--colors-hairline)] py-12 text-center">
              <p className="text-[length:var(--typography-body-md)] text-[var(--colors-body)]">No tasks yet.</p>
              {role !== ROLES.COLLABORATOR && (
                <button className="mt-2 text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/tasks', { state: { createTask: Date.now() } })}>
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--colors-hairline)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)]">
                    {['Task', 'Project', 'Column', 'Priority', 'Due'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[length:var(--typography-body-sm)] font-semibold uppercase tracking-wider text-[var(--colors-ink-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--colors-hairline)]">
                  {recentTasks.map((t) => {
                    const overdue = isOverdue(t.dueDate) && !isTerminalColumn(getTaskColumnName(t));
                    return (
                      <tr key={t.id} onClick={() => openTask(t)} className="cursor-pointer transition-colors hover:bg-[var(--colors-canvas-soft)]">
                        <td className="px-4 py-3 text-[length:var(--typography-body-md)] font-medium text-[var(--colors-ink)]">{t.title}</td>
                        <td className="px-4 py-3 text-[length:var(--typography-body-sm)] text-[var(--colors-body)]">{t.project?.name || t.projectName || '—'}</td>
                        <td className="px-4 py-3"><span className="pill whitespace-nowrap">{getTaskColumnName(t)}</span></td>
                        <td className="px-4 py-3"><span className="pill whitespace-nowrap">{t.priority}</span></td>
                        <td className={cn('px-4 py-3 text-[length:var(--typography-body-sm)]', overdue ? 'font-bold text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-body)]')}>
                          {t.dueDate ? formatDate(t.dueDate) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Needs attention */}
        <section className="space-y-4">
          <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Needs attention</h2>
          {loadingTasks ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-[var(--colors-canvas-soft)]" />)}</div>
          ) : riskTasks.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--colors-hairline)] py-12 text-center">
              <p className="text-[length:var(--typography-body-sm)] text-[var(--colors-body)]">Nothing overdue or unassigned. Nice.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {riskTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTask(t)}
                  className="flex w-full flex-col gap-1 rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4 text-left transition hover:border-[var(--colors-surface-pressed)]"
                >
                  <span className="font-semibold text-[var(--colors-ink)]">{t.title}</span>
                  <span className="text-sm text-[var(--colors-body)]">{t.project?.name || t.projectName || 'No project'} · {getTaskColumnName(t)}</span>
                  <span className="mt-1 flex flex-wrap gap-2">
                    {isOverdue(t.dueDate) && <span className="pill text-[var(--colors-priority-urgent)]">Overdue</span>}
                    {!(t.assignees ?? []).length && <span className="pill">Unassigned</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        task={taskModal.task}
        projects={projects}
        columns={columns}
        onSaved={(savedTask) => {
          setTasks((current) => current.map((task) => (task.id === savedTask.id ? { ...task, ...savedTask } : task)));
        }}
      />
    </div>
  );
}
