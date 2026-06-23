/**
 * @file TaskFilters.jsx
 * @description Horizontal workspace toolbar containing search and filter controls.
 */
import React from 'react';
import Input from '../common/Input';
import { TASK_PRIORITY_LIST } from '../../utils/constants';

export default function TaskFilters({ filters, columns = [], onChange }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] p-3 shadow-[var(--shadow-soft)]">
      <div className="min-w-[180px] flex-1 max-w-xs">
        <Input
          id="task-search"
          type="search"
          placeholder="Search tasks"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          }
        />
      </div>

      <select
        value={filters.columnId}
        onChange={(e) => onChange('columnId', e.target.value)}
        className={`h-12 cursor-pointer rounded-full border bg-[var(--colors-canvas-soft)] px-4 pr-8 text-sm font-semibold outline-none transition-colors focus-ring ${
          filters.columnId === 'Overdue'
            ? 'border-[var(--colors-priority-urgent)] text-[var(--colors-priority-urgent)]'
            : 'border-[var(--colors-hairline)] text-[var(--colors-body)] focus:border-[var(--colors-primary)]'
        }`}
        aria-label="Filter by column"
      >
        <option value="">All Columns</option>
        {columns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
        <option value="Overdue">Overdue</option>
      </select>

      <select
        value={filters.priority}
        onChange={(e) => onChange('priority', e.target.value)}
        className="h-12 cursor-pointer rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-4 pr-8 text-sm font-semibold text-[var(--colors-body)] outline-none transition-colors focus-ring focus:border-[var(--colors-primary)]"
        aria-label="Filter by priority"
      >
        <option value="">All Priorities</option>
        {TASK_PRIORITY_LIST.map((priority) => <option key={priority}>{priority}</option>)}
      </select>

      {(filters.search || filters.columnId || filters.priority) && (
        <button
          onClick={() => { onChange('search', ''); onChange('columnId', ''); onChange('priority', ''); }}
          className="h-12 rounded-full px-4 text-xs font-semibold text-[var(--colors-mute)] transition hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-body)] focus-ring"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
