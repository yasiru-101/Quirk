/**
 * @file AnalyticsPage.jsx
 * @description Analytics overview for project workflow health.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { taskService } from '../services/taskService';
import { getTaskColumnName, isOverdue } from '../utils/helpers';
import { computeTaskMetrics, computeRiskTasks, computeColumnCounts, computeProjectHealth } from '../utils/analytics';

export default function AnalyticsPage() {
  const { activeProject, activeWorkspace, projects } = useProject();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    taskService
      .getTasks()
      .then(({ data }) => setTasks(data.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const scopedTasks = useMemo(() => {
    if (!activeProject) return tasks;
    return tasks.filter((task) => task.projectId === activeProject.id);
  }, [activeProject, tasks]);

  const metrics = useMemo(() => computeTaskMetrics(scopedTasks), [scopedTasks]);
  const riskTasks = useMemo(() => computeRiskTasks(scopedTasks), [scopedTasks]);
  const columnCounts = useMemo(() => computeColumnCounts(scopedTasks), [scopedTasks]);
  const projectHealth = useMemo(() => computeProjectHealth(projects, tasks), [projects, tasks]);

  const title = activeProject
    ? `${activeProject.name} Analytics`
    : `${activeWorkspace?.name || 'Workspace'} Analytics`;

  return (
    <div className="page-shell animate-in space-y-8">
      <header className="dark-product-card overflow-hidden p-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Workflow health</p>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-[length:var(--typography-heading-1)] font-normal text-white">{title}</h1>
            <p className="mt-3 max-w-2xl text-white/62">
              Business signals for delivery health, ownership coverage, and schedule risk across the current workspace.
            </p>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/55">Completion rate</p>
            <p className="cb-mono mt-2 text-5xl text-white">{loading ? '--' : `${metrics.completionRate}%`}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--colors-primary)]" style={{ width: `${metrics.completionRate}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total tasks', metrics.total],
          ['Completion', `${metrics.completionRate}%`],
          ['Overdue risk', `${metrics.overdueRate}%`],
          ['Due in 7 days', metrics.dueSoon],
          ['Assigned', `${metrics.assignmentRate}%`],
          ['Avg active age', `${metrics.averageAgeDays}d`],
        ].map(([label, value]) => (
          <div key={label} className="feature-card">
            <p className="mb-3 text-[length:var(--typography-caption)] font-semibold text-[color:var(--colors-ink-muted)]">{label}</p>
            <p className="cb-mono text-[length:var(--typography-heading-2)] font-normal text-[var(--colors-ink)]">{loading ? '--' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="feature-card min-h-[320px]">
          <h2 className="mb-6 text-[length:var(--typography-title)] font-semibold">Column distribution</h2>
          <div className="space-y-4">
            {(columnCounts.length ? columnCounts : [['No tasks', 0]]).map(([column, count]) => {
              const width = metrics.total ? Math.max(8, Math.round((count / metrics.total) * 100)) : 8;
              return (
                <div key={column}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--colors-ink)]">{column}</span>
                    <span className="cb-mono text-[var(--colors-ink-muted)]">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--colors-surface-pressed)]">
                    <div className="h-full rounded-full bg-[var(--colors-primary)]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="feature-card min-h-[320px]">
          <h2 className="mb-6 text-[length:var(--typography-title)] font-semibold">Project delivery health</h2>
          <div className="space-y-3">
            {projectHealth.slice(0, 6).map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
                <div>
                  <p className="font-semibold text-[var(--colors-ink)]">{project.name}</p>
                  <p className="text-sm text-[var(--colors-body)]">{project.done}/{project.total} completed</p>
                </div>
                <span className={project.overdue ? 'pill text-[var(--colors-priority-urgent)]' : 'pill'}>
                  {project.overdue ? `${project.overdue} overdue` : `${project.completionRate}% done`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="feature-card">
        <h2 className="mb-5 text-[length:var(--typography-title)] font-semibold">Needs attention</h2>
        {riskTasks.length ? (
          <div className="divide-y divide-[var(--colors-hairline)]">
            {riskTasks.map((task) => (
              <div key={task._id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--colors-ink)]">{task.title}</p>
                  <p className="text-sm text-[var(--colors-body)]">{task.project?.name || task.projectName || 'No project'} - {getTaskColumnName(task)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOverdue(task.dueDate) && <span className="pill text-[var(--colors-priority-urgent)]">Overdue</span>}
                  {!(task.assignees ?? []).length && <span className="pill">Unassigned</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--colors-body)]">No overdue or unassigned active tasks in this scope.</p>
        )}
      </section>
    </div>
  );
}
