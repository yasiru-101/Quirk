/**
 * @file DashboardPage.jsx
 * @description Workspace dashboard screen displaying analytics, greetings, and recent tasks fetched from the API.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { ROLES } from '../utils/constants';
import { getPriorityColor, getStatusColor, formatDate, isOverdue, cn } from '../utils/helpers';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, colorClass, loading }) {
  return (
    <div className="card p-6 flex flex-col justify-between h-32 group hover:border-[var(--colors-primary)] transition-all overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="text-6xl">{icon}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm', colorClass)}>
          {icon}
        </div>
        <p className="text-[var(--typography-body-sm-strong)] font-semibold text-[var(--colors-body)] tracking-wide">{label}</p>
      </div>
      <div>
        {loading ? (
          <div className="skeleton h-8 w-16 rounded mt-2" />
        ) : (
          <p className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] tabular-nums mt-1 leading-none">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Main landing screen containing role-based stat grids and recent tasks from the API.
 */
export default function DashboardPage() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // ── Fetch stats based on role ────────────────────────────────────────────────
  useEffect(() => {
    setLoadingStats(true);

    if (role === ROLES.ADMIN) {
      userService
        .getUsers()
        .then(({ data }) => {
          const users = data.users ?? [];
          const total    = users.length;
          const active   = users.filter((u) => u.isActive).length;
          const inactive = total - active;
          const pending  = users.filter((u) => u.mustResetPassword && u.isActive).length;
          setStats([
            { label: 'Total Users',    value: total,    icon: '👥', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
            { label: 'Active',         value: active,   icon: '✓',  colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { label: 'Inactive',       value: inactive, icon: '⏸',  colorClass: 'bg-[var(--colors-canvas-softer)] text-[var(--colors-body)]' },
            { label: 'Pending Resets', value: pending,  icon: '🔐', colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
          ]);
        })
        .catch(() => setStats([]))
        .finally(() => setLoadingStats(false));
    } else {
      taskService
        .getTasks()
        .then(({ data }) => {
          const tasks   = data.tasks ?? [];
          const total   = tasks.length;
          const inProg  = tasks.filter((t) => t.status === 'In Progress').length;
          const done    = tasks.filter((t) => t.status === 'Completed').length;
          const overdue = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'Completed').length;

          if (role === ROLES.PROJECT_MANAGER) {
            setStats([
              { label: 'Total Tasks',  value: total,  icon: '📋', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
              { label: 'In Progress',  value: inProg, icon: '⚡', colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
              { label: 'Completed',    value: done,   icon: '✓',  colorClass: 'bg-[var(--colors-primary-glow)] text-[var(--colors-primary-deep)]' },
              { label: 'Overdue',      value: overdue,icon: '⚠',  colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
            ]);
          } else {
            const myTasks    = tasks;
            const dueThisWeek = myTasks.filter((t) => {
              if (!t.dueDate) return false;
              const due  = new Date(t.dueDate);
              const now  = new Date();
              const diff = (due - now) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 7;
            }).length;
            setStats([
              { label: 'My Tasks',      value: myTasks.length, icon: '📋', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
              { label: 'In Progress',   value: inProg,         icon: '⚡', colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
              { label: 'Completed',     value: done,           icon: '✓',  colorClass: 'bg-[var(--colors-primary-glow)] text-[var(--colors-primary-deep)]' },
              { label: 'Due This Week', value: dueThisWeek,    icon: '📅', colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
            ]);
          }
        })
        .catch(() => setStats([]))
        .finally(() => setLoadingStats(false));
    }
  }, [role]);

  // ── Fetch recent tasks (last 5) ───────────────────────────────────────────────
  useEffect(() => {
    if (role === ROLES.ADMIN) { setLoadingTasks(false); return; }
    setLoadingTasks(true);
    taskService
      .getTasks()
      .then(({ data }) => {
        const tasks = (data.tasks ?? []).slice(0, 5);
        setRecentTasks(tasks);
      })
      .catch(() => setRecentTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [role]);

  return (
    <div className="space-y-10 animate-in pb-10">
      {/* Welcome banner */}
      <div className="flex items-end justify-between border-b border-[var(--colors-hairline)] pb-6">
        <div>
          <h2 className="text-[var(--typography-display-sm)] font-bold text-[var(--colors-ink)]">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-[var(--typography-body-md)] text-[var(--colors-body)] mt-1.5">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="text-sm font-medium text-[var(--colors-mute)] hidden sm:block bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] px-4 py-2 rounded-full shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6 flex flex-col justify-between h-32">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
                <div className="skeleton h-8 w-16 rounded mt-2" />
              </div>
            ))
          : stats.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Recent tasks table (PM & Collaborator only) */}
      {role !== ROLES.ADMIN && (
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--colors-hairline)] flex items-center justify-between bg-[var(--colors-canvas-soft)]">
            <h3 className="text-base font-bold text-[var(--colors-ink)]">Recent Tasks</h3>
            <span className="text-xs font-medium text-[var(--colors-mute)] px-3 py-1 bg-[var(--colors-canvas-softer)] rounded-full">Last 5 tasks</span>
          </div>

          {loadingTasks ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-sm font-medium text-[var(--colors-body)]">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-softer)]">
                    {['Task', 'Status', 'Priority', 'Due Date'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-4 text-xs font-bold text-[var(--colors-body)] tracking-wider uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--colors-hairline)]">
                  {recentTasks.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-[var(--colors-canvas-soft)] transition-colors group"
                    >
                      <td className="px-6 py-4 text-[var(--colors-ink)] font-semibold">{t.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className={cn('px-6 py-4 text-sm font-medium', isOverdue(t.dueDate) && t.status !== 'Completed' ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-body)]')}>
                        {isOverdue(t.dueDate) && t.status !== 'Completed' && '⚠ '}{formatDate(t.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
