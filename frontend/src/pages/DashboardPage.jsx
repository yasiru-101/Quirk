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
function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4 group hover:border-zinc-700 transition-all">
      <div className={`text-2xl w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        {loading ? (
          <div className="skeleton h-7 w-10 rounded mb-1" />
        ) : (
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
        )}
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
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
  const [stats, setStats]       = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // ── Fetch stats based on role ────────────────────────────────────────────────
  useEffect(() => {
    setLoadingStats(true);

    if (role === ROLES.ADMIN) {
      // Admin: pull user counts
      userService
        .getUsers()
        .then(({ data }) => {
          const users = data.users ?? [];
          const total    = users.length;
          const active   = users.filter((u) => u.isActive).length;
          const inactive = total - active;
          const pending  = users.filter((u) => u.mustResetPassword && u.isActive).length;
          setStats([
            { label: 'Total Users',    value: total,    icon: '👥', color: 'text-indigo-400' },
            { label: 'Active Users',   value: active,   icon: '✓',  color: 'text-emerald-400' },
            { label: 'Inactive Users', value: inactive, icon: '⏸',  color: 'text-zinc-400' },
            { label: 'Pending Resets', value: pending,  icon: '🔐', color: 'text-amber-400' },
          ]);
        })
        .catch(() => setStats([]))
        .finally(() => setLoadingStats(false));
    } else {
      // PM + Collaborator: pull task counts
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
              { label: 'Total Tasks',  value: total,  icon: '📋', color: 'text-indigo-400' },
              { label: 'In Progress',  value: inProg, icon: '⚡', color: 'text-amber-400' },
              { label: 'Completed',    value: done,   icon: '✓',  color: 'text-emerald-400' },
              { label: 'Overdue',      value: overdue,icon: '⚠',  color: 'text-rose-400' },
            ]);
          } else {
            // Collaborator
            const myTasks    = tasks; // backend already scopes by user
            const dueThisWeek = myTasks.filter((t) => {
              if (!t.dueDate) return false;
              const due  = new Date(t.dueDate);
              const now  = new Date();
              const diff = (due - now) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 7;
            }).length;
            setStats([
              { label: 'My Tasks',      value: myTasks.length, icon: '📋', color: 'text-indigo-400' },
              { label: 'In Progress',   value: inProg,         icon: '⚡', color: 'text-amber-400' },
              { label: 'Completed',     value: done,           icon: '✓',  color: 'text-emerald-400' },
              { label: 'Due This Week', value: dueThisWeek,    icon: '📅', color: 'text-rose-400' },
            ]);
          }
        })
        .catch(() => setStats([]))
        .finally(() => setLoadingStats(false));
    }
  }, [role]);

  // ── Fetch recent tasks (last 5) ───────────────────────────────────────────────
  useEffect(() => {
    if (role === ROLES.ADMIN) { setLoadingTasks(false); return; } // Admin has no task board
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
    <div className="space-y-8 animate-in">
      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="text-[11px] text-zinc-600 hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-6 w-10 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
            ))
          : stats.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Recent tasks table (PM & Collaborator only) */}
      {role !== ROLES.ADMIN && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold text-zinc-200">Recent Tasks</h3>
            <span className="text-[11px] text-zinc-500">Last 5 tasks</span>
          </div>

          {loadingTasks ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <p className="text-center text-xs text-zinc-600 py-10">No tasks yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-light)' }}>
                    {['Task', 'Status', 'Priority', 'Due Date'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 tracking-wide uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b last:border-0 hover:bg-zinc-800/30 transition-colors"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <td className="px-5 py-3.5 text-zinc-200 font-medium">{t.title}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className={cn('px-5 py-3.5 text-xs', isOverdue(t.dueDate) && t.status !== 'Completed' ? 'text-rose-400 font-medium' : 'text-zinc-400')}>
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
