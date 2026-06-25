/**
 * @file TaskCard.jsx
 * @description Compact task card for Kanban columns.
 */
import React from 'react';
import { getPriorityColor, getStatusColor, getTaskColumnName, formatDate, getInitials, isOverdue, cn } from '../../utils/helpers';

export default function TaskCard({ task, columns = [], canManage = false, onColumnChange, onClick, onDelete }) {
  const overdue = isOverdue(task.dueDate);
  const columnName = getTaskColumnName(task);

  return (
    <div
      className="kanban-card group relative cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task._id);
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Match native button semantics: activate on Enter and Space (and stop
        // Space from scrolling the column).
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="kc-tags">
        <span className={cn('kc-tag font-bold', getPriorityColor(task.priority))}>
          {task.priority}
        </span>
        {canManage && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
            className="z-10 ml-auto text-[var(--colors-mute)] opacity-0 transition-all hover:text-[var(--colors-priority-urgent)] focus-ring group-hover:opacity-100"
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
        <div className="mb-2 line-clamp-2 text-[12px] text-[var(--colors-ink-muted)]">
          {task.description}
        </div>
      )}

      <div className="kc-footer">
        <div className="flex -space-x-1.5">
          {(task.assignees ?? []).slice(0, 3).map((user) => (
            <div
              key={user._id}
              title={user.name}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--colors-canvas)] bg-[var(--colors-surface-dark)] text-[9px] font-bold text-white shadow-sm"
            >
              {getInitials(user.name)}
            </div>
          ))}
        </div>

        {task.dueDate && (
          <span className={cn('kc-due', overdue ? 'overdue' : '')}>
            {overdue ? 'Overdue: ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} className="mt-3">
        <div className="relative">
          <select
            value={task.columnId || ''}
            onChange={(e) => onColumnChange?.(task._id, e.target.value)}
            className={cn(
              'w-full cursor-pointer appearance-none rounded-full border px-3 py-2 pr-10 text-xs font-bold outline-none transition-all focus-ring',
              getStatusColor(columnName)
            )}
            aria-label="Change task column"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>{column.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
