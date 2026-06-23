/**
 * @file AnalyticsPage.jsx
 * @description Analytics overview for project workflow health.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { taskService } from '../services/taskService';
import { getTaskColumnName, isOverdue, isTerminalColumn } from '../utils/helpers';

export default function AnalyticsPage() {
  const { activeProject, projects } = useProject();
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

  const metrics = useMemo(() => {
    const total = scopedTasks.length;
    const completed = scopedTasks.filter((task) => isTerminalColumn(getTaskColumnName(task))).length;
    const overdue = scopedTasks.filter((task) => isOverdue(task.dueDate) && !isTerminalColumn(getTaskColumnName(task))).length;
    const assigned = scopedTasks.filter((task) => (task.assignees ?? []).length > 0).length;
    return {
      total,
      completed,
      overdue,
      assigned,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      assignmentRate: total ? Math.round((assigned / total) * 100) : 0,
    };
  }, [scopedTasks]);

  const columnCounts = useMemo(() => {
    const counts = new Map();
    scopedTasks.forEach((task) => {
      const name = getTaskColumnName(task);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [scopedTasks]);

  const title = activeProject ? `${activeProject.name} Analytics` : 'Global Analytics';

  return (
    <div className="page-shell animate-in space-y-8">
      <header className="dark-product-card overflow-hidden p-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Workflow health</p>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-[length:var(--typography-heading-1)] font-normal text-white">{title}</h1>
            <p className="mt-3 max-w-2xl text-white/62">
              A compact readout of throughput, completion, assignment, and overdue risk across your current workspace.
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
          ['Completed', metrics.completed],
          ['Overdue', metrics.overdue],
          ['Assigned', `${metrics.assignmentRate}%`],
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
          <h2 className="mb-6 text-[length:var(--typography-title)] font-semibold">Project coverage</h2>
          <div className="space-y-3">
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
                <div>
                  <p className="font-semibold text-[var(--colors-ink)]">{project.name}</p>
                  <p className="text-sm text-[var(--colors-body)]">{project.columns?.length || 0} workflow columns</p>
                </div>
                <span className="pill">Active</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
