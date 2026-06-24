import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import TaskModal from '../components/tasks/TaskModal';
import { ROLES } from '../utils/constants';
import { formatDate, getTaskColumnName, isOverdue, isTerminalColumn, cn } from '../utils/helpers';

function StatCard({ label, value, loading }) {
  return (
    <div className="feature-card flex flex-col justify-between h-32 hover:border-[var(--colors-surface-pressed)] transition-all">
      <p className="text-[length:var(--typography-caption)] font-medium text-[color:var(--colors-ink-muted)] uppercase tracking-widest">{label}</p>
      <div>
        {loading ? (
          <div className="animate-pulse bg-[var(--colors-canvas-soft)] h-10 w-16 rounded mt-2" />
        ) : (
          <p className="text-[length:var(--typography-heading-1)] font-bold text-[color:var(--colors-ink)] tabular-nums leading-none tracking-[var(--letter-spacing-heading-1)]">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { projects } = useProject();
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskModal, setTaskModal] = useState({ open: false, task: null });

  const columns = React.useMemo(
    () => projects.flatMap((project) => (project.columns ?? []).map((column) => ({
      ...column,
      projectId: column.projectId || project.id,
      projectName: project.name,
    }))),
    [projects]
  );

  useEffect(() => {
    setLoadingStats(true);
    if (role === ROLES.ADMIN) {
      userService.getUsers()
        .then(({ data }) => {
          const users = data.users ?? [];
          const total    = users.length;
          const active   = users.filter((u) => u.isActive).length;
          const inactive = total - active;
          const pending  = users.filter((u) => u.mustResetPassword && u.isActive).length;
          setStats([
            { label: 'Total Users', value: total },
            { label: 'Active', value: active },
            { label: 'Inactive', value: inactive },
            { label: 'Pending Resets', value: pending },
          ]);
        })
        .catch(() => setStats([]))
        .finally(() => setLoadingStats(false));
    } else {
      taskService.getTasks()
        .then(({ data }) => {
          const tasks   = data.tasks ?? [];
          const total   = tasks.length;
          const inProg  = tasks.filter((t) => getTaskColumnName(t).toLowerCase() === 'in progress').length;
          const done    = tasks.filter((t) => isTerminalColumn(getTaskColumnName(t))).length;
          const overdue = tasks.filter((t) => isOverdue(t.dueDate) && !isTerminalColumn(getTaskColumnName(t))).length;

          if (role === ROLES.PROJECT_MANAGER) {
            setStats([
              { label: 'Total Tasks', value: total },
              { label: 'In Progress', value: inProg },
              { label: 'Completed', value: done },
              { label: 'Overdue', value: overdue },
            ]);
          } else {
            const dueThisWeek = tasks.filter((t) => {
              if (!t.dueDate) return false;
              const due  = new Date(t.dueDate);
              const now  = new Date();
              const diff = (due - now) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 7;
            }).length;
            setStats([
              { label: 'My Tasks', value: total },
              { label: 'In Progress', value: inProg },
              { label: 'Completed', value: done },
              { label: 'Due This Week', value: dueThisWeek },
            ]);
          }
        })
        .catch(() => setStats([]))
        .finally(() => setLoadingStats(false));
    }
  }, [role]);

  useEffect(() => {
    if (role === ROLES.ADMIN) { setLoadingTasks(false); return; }
    setLoadingTasks(true);
    taskService.getTasks()
      .then(({ data }) => {
        setRecentTasks((data.tasks ?? []).slice(0, 5));
      })
      .catch(() => setRecentTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [role]);

  const greeting = getGreeting();

  return (
    <div className="animate-in max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-12">
      
      {/* Uber-style minimalist header */}
      <header className="space-y-2">
        <h1 className="text-[length:var(--typography-heading-1)] font-bold text-[color:var(--colors-ink)] tracking-[var(--letter-spacing-heading-1)]">
          Good {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-[length:var(--typography-body-md)] text-[color:var(--colors-ink-muted)]">
          Here's an overview of your workspace today.
        </p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingStats
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="feature-card h-32 flex flex-col justify-between border-[var(--colors-hairline)]">
                <div className="animate-pulse bg-[var(--colors-canvas-soft)] h-4 w-24 rounded" />
                <div className="animate-pulse bg-[var(--colors-canvas-soft)] h-10 w-16 rounded mt-2" />
              </div>
            ))
          : stats.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Quick Actions */}
      {role !== ROLES.ADMIN ? (
        <div className="flex items-center gap-4 py-2 border-b border-[var(--colors-hairline)]">
          <p className="text-sm font-medium text-[color:var(--colors-ink-muted)]">Quick Actions:</p>
          {role === ROLES.PROJECT_MANAGER ? (
            <>
              <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/tasks', { state: { createTask: Date.now() } })}>+ New Task</button>
              <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/projects')}>+ New Project</button>
            </>
          ) : (
            <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => navigate('/tasks')}>My Tasks</button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 py-2 border-b border-[var(--colors-hairline)]">
          <p className="text-sm font-medium text-[color:var(--colors-ink-muted)]">Admin Actions:</p>
          <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => window.location.href = '/users'}>Manage Users</button>
          <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => window.location.href = '/projects'}>View All Projects</button>
          <button className="text-sm font-medium text-[var(--colors-primary)] hover:underline" onClick={() => window.location.href = '/settings'}>System Settings</button>
        </div>
      )}

      {/* Recent tasks table */}
      {role !== ROLES.ADMIN ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--colors-hairline)] pb-4">
            <h2 className="text-[length:var(--typography-display-sm)] font-bold text-[var(--colors-ink)]">Recent Tasks</h2>
          </div>

          {loadingTasks ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-[var(--colors-canvas-soft)] h-12 rounded" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="py-12 text-center border border-[var(--colors-hairline)] border-dashed rounded-lg">
              <p className="text-[length:var(--typography-body-md)] text-[var(--colors-body)]">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[var(--colors-ink)]">
                    {['Task', 'Column', 'Priority', 'Due Date'].map((h) => (
                      <th key={h} className="py-4 px-2 text-[length:var(--typography-body-sm)] font-bold text-[var(--colors-ink)] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--colors-hairline)]">
                  {recentTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setTaskModal({ open: true, task: t })}
                      className="cursor-pointer transition-colors hover:bg-[var(--colors-canvas-soft)]"
                    >
                      <td className="py-4 px-2 text-[length:var(--typography-body-md)] font-medium text-[var(--colors-ink)]">{t.title}</td>
                      <td className="py-4 px-2">
                        <span className="bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)] px-3 py-1 text-[length:var(--typography-body-sm)] uppercase tracking-wider rounded-[var(--radius-pill)] whitespace-nowrap">
                          {getTaskColumnName(t)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)] px-3 py-1 text-[length:var(--typography-body-sm)] uppercase tracking-wider rounded-[var(--radius-pill)] whitespace-nowrap">
                          {t.priority}
                        </span>
                      </td>
                      <td className={cn('py-4 px-2 text-[length:var(--typography-body-sm)]', isOverdue(t.dueDate) && !isTerminalColumn(getTaskColumnName(t)) ? 'text-[var(--colors-priority-urgent)] font-bold' : 'text-[var(--colors-body)]')}>
                        {formatDate(t.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--colors-hairline)] pb-4">
            <h2 className="text-[length:var(--typography-display-sm)] font-bold text-[var(--colors-ink)]">System Overview</h2>
          </div>
          <div className="py-12 text-center border border-[var(--colors-hairline)] border-dashed rounded-lg bg-[var(--colors-canvas-soft)]">
            <p className="text-[length:var(--typography-body-md)] font-semibold text-[var(--colors-ink)] mb-2">Everything is running smoothly.</p>
            <p className="text-[length:var(--typography-body-sm)] text-[var(--colors-body)]">Use the quick actions above or the navigation sidebar to manage the platform.</p>
          </div>
        </section>
      )}
      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        task={taskModal.task}
        projects={projects}
        columns={columns}
        onSaved={(savedTask) => {
          setRecentTasks((current) => current.map((task) => (task._id === savedTask._id ? savedTask : task)));
        }}
      />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
