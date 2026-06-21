/**
 * @file TaskCard.jsx
 * @description Mini dashboard task card adhering to the Quirk Mint & Ink design system.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';
import { ROLES, TASK_STATUS_LIST } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

/**
 * Compact presentation item for individual tasks. Triggers details dialogs 
 * and contains inline quick status selection drops.
 *
 * @param {object} props.task - Main task configuration structure
 * @param {Function} props.onStatusChange - Inline status modification handler
 * @param {Function} props.onClick - Click detail popover trigger
 * @param {Function} props.onDelete - Handler to remove task item
 */
export default function TaskCard({ task, onStatusChange, onClick, onDelete }) {
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;
  const overdue = isOverdue(task.dueDate);

  // Helper to render priority icon
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
        'p-3 space-y-3 cursor-pointer group transition-all relative',
        'rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] dark:bg-[var(--colors-canvas-soft)]',
        'hover:shadow-sm dark:hover:shadow-none dark:hover:shadow-[0_0_0_2px_var(--colors-primary-glow)]'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Priority + delete */}
      <div className="flex items-center justify-between">
        <span className={cn('text-[var(--typography-caption)] font-semibold flex items-center gap-1', getPriorityColor(task.priority))}>
          <span aria-hidden>{renderPriorityIcon(task.priority)}</span>
          {task.priority}
        </span>
        {isPM && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
            className="opacity-0 group-hover:opacity-100 text-[var(--colors-mute)] hover:text-[var(--colors-priority-urgent)] transition-all p-1 rounded-full hover:bg-[rgba(255,255,255,0.05)] focus-ring z-10"
            aria-label="Delete task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <p className="text-[var(--typography-body-sm)] font-medium text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] leading-snug line-clamp-2">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-[var(--typography-caption)] text-[var(--colors-body)] dark:text-[var(--colors-on-dark-body)] line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {/* Assignees */}
        <div className="flex -space-x-1.5">
          {(task.assignees ?? []).slice(0, 3).map((u) => (
            <div
              key={u._id}
              title={u.name}
              className="w-6 h-6 rounded-full bg-[var(--colors-canvas-softer)] text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] border-2 border-[var(--colors-canvas)] flex items-center justify-center text-[10px] font-semibold"
            >
              {getInitials(u.name)}
            </div>
          ))}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <span className={cn('text-[var(--typography-caption)] font-medium', overdue ? 'text-[var(--colors-priority-urgent)]' : 'text-[var(--colors-mute)]')}>
            {overdue ? '⚠ ' : ''}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Status chip dropdown */}
      <div onClick={(e) => e.stopPropagation()} className="mt-2">
        <select
          value={task.status}
          onChange={(e) => onStatusChange?.(task._id, e.target.value)}
          className={cn(
            'w-full text-xs font-semibold px-2 py-1.5 rounded-full cursor-pointer focus-ring outline-none appearance-none text-center',
            getStatusColor(task.status)
          )}
          aria-label="Change task status"
        >
          {TASK_STATUS_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
