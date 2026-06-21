/**
 * @file TaskTable.jsx
 * @description Spreadsheet table listing tasks, statuses, assigning agents, and actions adhering to the solid premium design.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';
import { ROLES, TASK_STATUS_LIST } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { ClipboardIcon, FlameIcon, ArrowUpIcon, ArrowDownIcon } from '../common/Icons';

export default function TaskTable({ tasks, onEdit, onDelete, onStatusChange, onCreateNew }) {
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardIcon className="w-6 h-6 text-[var(--colors-mute)]" />}
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

  const renderPriorityIcon = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return <FlameIcon className="w-3.5 h-3.5" />;
    if (p === 'high') return <ArrowUpIcon className="w-3.5 h-3.5" />;
    if (p === 'low') return <ArrowDownIcon className="w-3.5 h-3.5" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-current" />; // Medium
  };

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] overflow-hidden animate-in shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-softer)]">
              {['Title', 'Status', 'Priority', 'Assigned To', 'Due Date', ...(isPM ? ['Actions'] : [])].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-4 text-xs font-bold text-[var(--colors-body)] tracking-wider uppercase whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--colors-hairline)]">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate);
              return (
                <tr
                  key={task._id}
                  className="hover:bg-[var(--colors-canvas-soft)] transition-colors group"
                >
                  {/* Title */}
                  <td className="px-6 py-4 font-medium text-[var(--colors-ink)] max-w-[280px]">
                    <p className="truncate font-bold text-[var(--typography-body-sm)]">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-[var(--colors-body)] truncate mt-1">{task.description}</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="relative w-fit">
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange?.(task._id, e.target.value)}
                        className={cn(
                          'text-xs font-bold px-3 py-1.5 rounded-[var(--radius-lg)] border cursor-pointer outline-none transition-colors focus-ring appearance-none text-center pr-8',
                          getStatusColor(task.status)
                        )}
                      >
                        {TASK_STATUS_LIST.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4">
                    <span className={cn('text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full border w-fit', getPriorityColor(task.priority))}>
                      <span aria-hidden>{renderPriorityIcon(task.priority)}</span>
                      {task.priority}
                    </span>
                  </td>

                  {/* Assignees */}
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {(task.assignees ?? []).slice(0, 4).map((u) => (
                        <div
                          key={u._id}
                          title={u.name}
                          className="w-7 h-7 rounded-full bg-[var(--colors-canvas-softer)] text-[var(--colors-ink)] border-2 border-[var(--colors-canvas)] flex items-center justify-center text-[10px] font-bold shadow-sm"
                        >
                          {getInitials(u.name)}
                        </div>
                      ))}
                      {(task.assignees ?? []).length === 0 && (
                        <span className="text-[11px] font-medium text-[var(--colors-mute)]">—</span>
                      )}
                    </div>
                  </td>

                  {/* Due date */}
                  <td className="px-6 py-4">
                    <span className={cn('text-xs font-bold tracking-wide', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-body)]')}>
                      {overdue && '⚠ '}{formatDate(task.dueDate)}
                    </span>
                  </td>

                  {/* Actions (PM only) */}
                  {isPM && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit?.(task)}
                          className="text-[var(--colors-mute)] hover:text-[var(--colors-ink)] p-2 rounded-lg hover:bg-[var(--colors-surface-pressed)] transition-colors focus-ring"
                          aria-label="Edit task"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete?.(task._id)}
                          className="text-[var(--colors-mute)] hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors focus-ring"
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
    </div>
  );
}
