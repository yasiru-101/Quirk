/**
 * @file TaskFilters.jsx
 * @description Horizontal workspace toolbar containing search inputs and column drop downs.
 */
import React from 'react';
import Input from '../common/Input';
import { TASK_PRIORITY_LIST } from '../../utils/constants';

/**
 * Filter/search bar for the task workspace.
 * @param {object} filters - { search, columnId, priority }
 * @param {Function} onChange(name, value)
 */
/**
 * Filters component for searching and categorizing tasks.
 *
 * @param {object} props.filters - Active filters config state
 * @param {Function} props.onChange - Trigger signaling active criteria shifts
 */
export default function TaskFilters({ filters, columns = [], onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="flex-1 min-w-[180px] max-w-xs">
        <Input
          id="task-search"
          type="search"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          }
        />
      </div>

      {/* Column filter includes a virtual "Overdue" option */}
      <select
        value={filters.columnId}
        onChange={(e) => onChange('columnId', e.target.value)}
        className={`h-10 px-3 pr-8 rounded-lg bg-canvas-soft border text-sm outline-none transition-colors cursor-pointer
          ${filters.columnId === 'Overdue'
            ? 'border-rose-500/60 text-rose-400 focus:border-rose-500'
            : 'border-surface-pressed/50 text-body focus:border-primary focus:ring-1 focus:ring-primary'}`}
        aria-label="Filter by column"
      >
        <option value="">All Columns</option>
        {columns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
        {/* Virtual filter handled in parent via isOverdue() */}
        <option value="Overdue">⚠ Overdue</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onChange('priority', e.target.value)}
        className="h-10 px-3 pr-8 rounded-lg bg-canvas-soft border border-surface-pressed/50 text-sm text-body outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
        aria-label="Filter by priority"
      >
        <option value="">All Priorities</option>
        {TASK_PRIORITY_LIST.map((p) => <option key={p}>{p}</option>)}
      </select>

      {/* Clear filters */}
      {(filters.search || filters.columnId || filters.priority) && (
        <button
          onClick={() => { onChange('search', ''); onChange('columnId', ''); onChange('priority', ''); }}
          className="text-xs text-mute hover:text-body transition-colors px-3 h-10 rounded-lg hover:bg-hairline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
