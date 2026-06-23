/**
 * @file TaskCard.jsx
 * @description Mini dashboard task card adhering to the Quirk Mint & Ink design system.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, getTaskColumnName, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function TaskCard({ task, columns = [], onColumnChange, onClick, onDelete }) {
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;
  const overdue = isOverdue(task.dueDate);
  const columnName = getTaskColumnName(task);

  const renderPriorityIcon = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return '🔥';
    if (p === 'high') return '↑';
    if (p === 'low') return '↓';
    return '•'; // Medium
  };

  return (
    <div
      className="kanban-card group relative cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task._id);
        // Optional: you can set drag image or effect here
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="kc-tags">
        <span className={cn('kc-tag flex items-center gap-1 font-bold', getPriorityColor(task.priority))}>
          <span aria-hidden>{renderPriorityIcon(task.priority)}</span>
          {task.priority}
        </span>
        {isPM && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
            className="opacity-0 group-hover:opacity-100 ml-auto text-[var(--colors-mute)] hover:text-rose-500 transition-all focus-ring z-10"
            aria-label="Delete task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      <div className="kc-title">{task.title}</div>
      {task.description && (
        <div className="text-[12px] text-[var(--colors-ink-muted)] mb-2 line-clamp-2">
          {task.description}
        </div>
      )}

      <div className="kc-footer">
        <div className="flex -space-x-1.5">
          {(task.assignees ?? []).slice(0, 3).map((u) => (
            <div
              key={u._id}
              title={u.name}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-2 border-[var(--colors-canvas)] flex items-center justify-center text-[9px] font-bold shadow-sm"
            >
              {getInitials(u.name)}
            </div>
          ))}
        </div>

        {task.dueDate && (
          <span className={cn('kc-due', overdue ? 'overdue' : '')}>
            {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} className="mt-2">
        <div className="relative">
          <select
            value={task.columnId || ''}
            onChange={(e) => onColumnChange?.(task._id, e.target.value)}
            className={cn(
              'w-full text-xs font-bold px-3 py-2 rounded-[var(--radius-lg)] cursor-pointer focus-ring outline-none appearance-none transition-all border',
              getStatusColor(columnName)
            )}
            aria-label="Change task column"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>{column.name}</option>
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
