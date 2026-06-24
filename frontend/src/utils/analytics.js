/**
 * @file analytics.js
 * @description Pure task-analytics computations shared by the Dashboard and the
 * Analytics page. Operate on the task array returned by the task query API so no
 * per-view endpoints are needed (ADR 0005).
 */
import { getTaskColumnName, isOverdue, isTerminalColumn } from './helpers';

const DAY_MS = 1000 * 60 * 60 * 24;

/** Operational metrics for a set of tasks. */
export function computeTaskMetrics(tasks = []) {
  const total = tasks.length;
  const completed = tasks.filter((t) => isTerminalColumn(getTaskColumnName(t))).length;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate) && !isTerminalColumn(getTaskColumnName(t))).length;
  const assigned = tasks.filter((t) => (t.assignees ?? []).length > 0).length;
  const inProgress = tasks.filter((t) => getTaskColumnName(t).toLowerCase() === 'in progress').length;
  const dueSoon = tasks.filter((t) => {
    if (!t.dueDate || isTerminalColumn(getTaskColumnName(t))) return false;
    const diffDays = (new Date(t.dueDate) - new Date()) / DAY_MS;
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  const activeTasks = tasks.filter((t) => !isTerminalColumn(getTaskColumnName(t)));
  const averageAgeDays = activeTasks.length
    ? Math.round(
        activeTasks.reduce((sum, t) => sum + Math.max(0, (new Date() - new Date(t.createdAt)) / DAY_MS), 0) /
          activeTasks.length
      )
    : 0;
  return {
    total,
    completed,
    overdue,
    dueSoon,
    assigned,
    inProgress,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    assignmentRate: total ? Math.round((assigned / total) * 100) : 0,
    overdueRate: total ? Math.round((overdue / total) * 100) : 0,
    averageAgeDays,
  };
}

/** Active tasks that are overdue or unassigned, soonest-due first. */
export function computeRiskTasks(tasks = [], limit = 5) {
  return tasks
    .filter((t) => !isTerminalColumn(getTaskColumnName(t)) && (isOverdue(t.dueDate) || !(t.assignees ?? []).length))
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    })
    .slice(0, limit);
}

/** Task counts per workflow column, descending. */
export function computeColumnCounts(tasks = []) {
  const counts = new Map();
  tasks.forEach((t) => {
    const name = getTaskColumnName(t);
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Per-project delivery health, most at-risk first. */
export function computeProjectHealth(projects = [], tasks = []) {
  return projects
    .map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => isTerminalColumn(getTaskColumnName(t))).length;
      const overdue = projectTasks.filter((t) => isOverdue(t.dueDate) && !isTerminalColumn(getTaskColumnName(t))).length;
      return { ...project, total, done, overdue, completionRate: total ? Math.round((done / total) * 100) : 0 };
    })
    .sort((a, b) => b.overdue - a.overdue || b.total - a.total);
}
