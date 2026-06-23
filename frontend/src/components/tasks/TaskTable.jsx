/**
 * @file TaskTable.jsx
 * @description Table listing tasks, workflow columns, assignees, and actions.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, getTaskColumnName, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { ClipboardIcon, FlameIcon, ArrowUpIcon, ArrowDownIcon } from '../common/Icons';

export default function TaskTable({ tasks, columns, canManageTasks = false, onEdit, onDelete, onColumnChange, onCreateNew }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardIcon className="w-6 h-6 text-[var(--colors-mute)]" />}
        title="No tasks found"
        description={canManageTasks ? 'Create your first task to get the team moving.' : 'No tasks have been assigned to you yet.'}
        action={
          canManageTasks && (
            <Button variant="primary" size="sm" onClick={onCreateNew}>
              New task
            </Button>
          )
        }
      />
    );
  }

  const renderPriorityIcon = (priority) => {
    const normalized = priority?.toLowerCase();
    if (normalized === 'urgent') return <FlameIcon className="h-3.5 w-3.5" />;
    if (normalized === 'high') return <ArrowUpIcon className="h-3.5 w-3.5" />;
    if (normalized === 'low') return <ArrowDownIcon className="h-3.5 w-3.5" />;
    return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
  };

  return (
    <div className="h-full overflow-auto animate-in rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shadow-[var(--shadow-soft)]">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr>
            {['Title', 'Project', 'Column', 'Priority', 'Assigned To', 'Due Date', ...(canManageTasks ? ['Actions'] : [])].map((heading) => (
              <th
                key={heading}
                className="whitespace-nowrap border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--colors-ink-muted)]"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--colors-hairline)]">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate);
            const taskColumns = columns.filter((column) => column.projectId === task.projectId);
            const columnName = getTaskColumnName(task);

            return (
              <tr key={task._id} className="group transition-colors hover:bg-[var(--colors-canvas-soft)]">
                <td className="min-w-[220px] px-4 py-3 font-medium text-[var(--colors-ink)]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--colors-primary)]" />
                    <p className="truncate font-medium">{task.title}</p>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold text-[var(--colors-ink-muted)]">
                  {task.projectName || task.project?.name || 'No project'}
                </td>

                <td className="px-4 py-3">
                  <div className="relative w-fit">
                    <select
                      value={task.columnId || ''}
                      onChange={(e) => onColumnChange?.(task._id, e.target.value)}
                      className={cn(
                        'cursor-pointer appearance-none rounded-full px-3 py-1 pr-7 text-center text-[12px] font-semibold outline-none transition-colors focus-ring',
                        getStatusColor(columnName)
                      )}
                    >
                      {taskColumns.map((column) => (
                        <option key={column.id} value={column.id}>{column.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className={cn('flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', getPriorityColor(task.priority))}>
                    <span aria-hidden>{renderPriorityIcon(task.priority)}</span>
                    {task.priority}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex -space-x-1">
                    {(task.assignees ?? []).slice(0, 4).map((user) => (
                      <div
                        key={user._id}
                        title={user.name}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--colors-canvas)] bg-[var(--colors-surface-dark)] text-[8px] font-bold text-white shadow-sm"
                      >
                        {getInitials(user.name)}
                      </div>
                    ))}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <span className={cn('text-[12px] font-semibold', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-ink-muted)]')}>
                    {overdue ? 'Overdue: ' : ''}{formatDate(task.dueDate)}
                  </span>
                </td>

                {canManageTasks && (
                  <td className="w-[92px] px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => onEdit?.(task)}
                        className="rounded-full p-1.5 text-[var(--colors-ink-faint)] transition-colors hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-ink)] focus-ring"
                        aria-label="Edit task"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete?.(task._id)}
                        className="rounded-full p-1.5 text-[var(--colors-ink-faint)] transition-colors hover:bg-red-50 hover:text-[var(--colors-priority-urgent)] focus-ring dark:hover:bg-red-950/30"
                        aria-label="Delete task"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
