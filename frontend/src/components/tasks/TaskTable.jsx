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
    <div className="bg-[var(--colors-canvas)] h-full overflow-auto animate-in">
      <table className="w-full text-[13px] border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            {['Title', 'Status', 'Priority', 'Assigned To', 'Due Date', ...(isPM ? ['Actions'] : [])].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 text-[11px] font-semibold text-[var(--colors-ink-muted)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] whitespace-nowrap"
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
                  className="hover:bg-[var(--colors-canvas-soft)] transition-colors group"
                >
                  {/* Title */}
                  <td className="px-3 py-2 border border-[var(--colors-hairline)] font-medium text-[var(--colors-ink)] w-1/3 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--colors-ink-faint)]">▶</span>
                      <p className="truncate font-medium">{task.title}</p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2 border border-[var(--colors-hairline)]">
                    <div className="relative w-fit">
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange?.(task._id, e.target.value)}
                        className={cn(
                          'text-[12px] font-medium px-2 py-1 rounded-[var(--radius-sm)] cursor-pointer outline-none transition-colors focus-ring appearance-none text-center pr-6',
                          getStatusColor(task.status)
                        )}
                      >
                        {TASK_STATUS_LIST.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-2 border border-[var(--colors-hairline)]">
                    <span className={cn('text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-sm)] w-fit', getPriorityColor(task.priority))}>
                      <span aria-hidden>{renderPriorityIcon(task.priority)}</span>
                      {task.priority}
                    </span>
                  </td>

                  {/* Assignees */}
                  <td className="px-3 py-2 border border-[var(--colors-hairline)]">
                    <div className="flex -space-x-1">
                      {(task.assignees ?? []).slice(0, 4).map((u) => (
                        <div
                          key={u._id}
                          title={u.name}
                          className="w-5 h-5 rounded-full bg-[var(--colors-canvas-soft)] text-[var(--colors-ink)] border border-[var(--colors-canvas)] flex items-center justify-center text-[8px] font-bold shadow-sm"
                        >
                          {getInitials(u.name)}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Due date */}
                  <td className="px-3 py-2 border border-[var(--colors-hairline)] whitespace-nowrap">
                    <span className={cn('text-[12px] font-medium', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-ink-muted)]')}>
                      {overdue && '⚠ '}{formatDate(task.dueDate)}
                    </span>
                  </td>

                  {/* Actions (PM only) */}
                  {isPM && (
                    <td className="px-3 py-2 border border-[var(--colors-hairline)] w-[80px]">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit?.(task)}
                          className="text-[var(--colors-ink-faint)] hover:text-[var(--colors-ink)] p-1 rounded hover:bg-[var(--colors-surface-pressed)] transition-colors focus-ring"
                          aria-label="Edit task"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete?.(task._id)}
                          className="text-[var(--colors-ink-faint)] hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors focus-ring"
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
