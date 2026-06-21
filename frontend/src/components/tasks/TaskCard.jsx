/**
 * @file TaskCard.jsx
 * @description Mini dashboard task card adhering to the Quirk Mint & Ink design system.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';
import { ROLES, TASK_STATUS_LIST } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function TaskCard({ task, onStatusChange, onClick, onDelete }) {
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;
  const overdue = isOverdue(task.dueDate);

  const renderPriorityIcon = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return '🔥';
    if (p === 'high') return '↑';
    if (p === 'low') return '↓';
    return '•'; // Medium
  };

  return (
    <div
      className={cn(
        'p-4 space-y-4 cursor-pointer group transition-all relative',
        'rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)]',
        'hover:border-[var(--colors-primary)] hover:shadow-md'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', getPriorityColor(task.priority))}>
          <span aria-hidden className="mr-1">{renderPriorityIcon(task.priority)}</span>
          {task.priority}
        </span>
        {isPM && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
            className="opacity-0 group-hover:opacity-100 text-[var(--colors-mute)] hover:text-rose-500 transition-all p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 focus-ring z-10"
            aria-label="Delete task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      <div>
        <p className="text-[var(--typography-body-md-strong)] font-bold text-[var(--colors-ink)] leading-snug line-clamp-2">
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-[var(--colors-body)] mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--colors-hairline)]">
        <div className="flex -space-x-2">
          {(task.assignees ?? []).slice(0, 3).map((u) => (
            <div
              key={u._id}
              title={u.name}
              className="w-7 h-7 rounded-full bg-[var(--colors-canvas-softer)] text-[var(--colors-ink)] border-2 border-[var(--colors-canvas)] flex items-center justify-center text-[10px] font-bold shadow-sm"
            >
              {getInitials(u.name)}
            </div>
          ))}
        </div>

        {task.dueDate && (
          <span className={cn('text-[11px] font-bold tracking-wide', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-mute)]')}>
            {overdue ? '⚠ ' : ''}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} className="mt-2">
        <div className="relative">
          <select
            value={task.status}
            onChange={(e) => onStatusChange?.(task._id, e.target.value)}
            className={cn(
              'w-full text-xs font-bold px-3 py-2 rounded-[var(--radius-lg)] cursor-pointer focus-ring outline-none appearance-none transition-all border',
              getStatusColor(task.status)
            )}
            aria-label="Change task status"
          >
            {TASK_STATUS_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
