/**
 * @file TaskTable.jsx
 * @description Spreadsheet table listing tasks, statuses, assigning agents, and actions adhering to Mint & Ink design.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';
import { ROLES, TASK_STATUS_LIST } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

/**
 * Renders a spreadsheet list layout for tasks. Includes inline status selectors,
 * assignees, due date urgency flags, and action triggers for PM roles.
 *
 * @param {object[]} props.tasks - Flat list arrays of tasks
 * @param {Function} props.onEdit - Task edit handler
 * @param {Function} props.onDelete - Task delete handler
 * @param {Function} props.onStatusChange - Quick status change dispatcher
 * @param {Function} props.onCreateNew - Create task callback
 */
export default function TaskTable({ tasks, onEdit, onDelete, onStatusChange, onCreateNew }) {
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No tasks found"
        description={isPM ? 'Create your first task to get the team moving.' : 'No tasks have been assigned to you yet.'}
        action={
          isPM && (
            <Button variant="primary" size="sm" onClick={onCreateNew}>
              + New Task
            </Button>
          )
        }
      />
    );
  }

  // Helper to render priority icon
  const renderPriorityIcon = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return '🔥';
    if (p === 'high') return '↑';
    if (p === 'low') return '↓';
    return '•'; // Medium
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] dark:bg-[var(--colors-canvas-soft)] overflow-hidden animate-in">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] dark:bg-[var(--colors-canvas-softer)]">
              {['Title', 'Status', 'Priority', 'Assigned To', 'Due Date', ...(isPM ? ['Actions'] : [])].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-[var(--typography-caption)] font-semibold text-[var(--colors-body)] dark:text-[var(--colors-on-dark-body)] tracking-wider uppercase whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate);
              return (
                <tr
                  key={task._id}
                  className="border-b last:border-0 hover:bg-[var(--colors-canvas-soft)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors group border-[var(--colors-hairline)]"
                >
                  {/* Title */}
                  <td className="px-5 py-4 font-medium text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] max-w-[280px]">
                    <p className="truncate text-[var(--typography-body-sm)]">{task.title}</p>
                    {task.description && (
                      <p className="text-[var(--typography-caption)] text-[var(--colors-body)] dark:text-[var(--colors-on-dark-body)] truncate mt-0.5">{task.description}</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange?.(task._id, e.target.value)}
                      className={cn(
                        'text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer outline-none transition-colors focus-ring appearance-none text-center',
                        getStatusColor(task.status)
                      )}
                    >
                      {TASK_STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4">
                    <span className={cn('text-[var(--typography-caption)] font-semibold flex items-center gap-1', getPriorityColor(task.priority))}>
                      <span aria-hidden>{renderPriorityIcon(task.priority)}</span>
                      {task.priority}
                    </span>
                  </td>

                  {/* Assignees */}
                  <td className="px-5 py-4">
                    <div className="flex -space-x-1.5">
                      {(task.assignees ?? []).slice(0, 4).map((u) => (
                        <div
                          key={u._id}
                          title={u.name}
                          className="w-6 h-6 rounded-full bg-[var(--colors-canvas-softer)] text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] border-2 border-[var(--colors-canvas)] flex items-center justify-center text-[10px] font-semibold"
                        >
                          {getInitials(u.name)}
                        </div>
                      ))}
                      {(task.assignees ?? []).length === 0 && (
                        <span className="text-[11px] text-[var(--colors-mute)]">—</span>
                      )}
                    </div>
                  </td>

                  {/* Due date */}
                  <td className="px-5 py-4">
                    <span className={cn('text-[var(--typography-caption)] font-medium', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-mute)]')}>
                      {overdue && '⚠ '}{formatDate(task.dueDate)}
                    </span>
                  </td>

                  {/* Actions (PM only) */}
                  {isPM && (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit?.(task)}
                          className="text-[var(--colors-mute)] hover:text-[var(--colors-ink)] dark:hover:text-[var(--colors-on-dark)] p-1.5 rounded-full hover:bg-[var(--colors-surface-pressed)] transition-colors focus-ring"
                          aria-label="Edit task"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete?.(task._id)}
                          className="text-[var(--colors-mute)] hover:text-[var(--colors-priority-urgent)] p-1.5 rounded-full hover:bg-[rgba(255,0,0,0.05)] transition-colors focus-ring"
                          aria-label="Delete task"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    </div>
  );
}
