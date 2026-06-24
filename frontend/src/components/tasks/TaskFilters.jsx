/**
 * @file TaskFilters.jsx
 * @description Horizontal workspace toolbar containing search and filter controls.
 */
import React from 'react';
import Input from '../common/Input';
import SelectField from '../common/SelectField';
import { TASK_PRIORITY_LIST } from '../../utils/constants';

export default function TaskFilters({ filters, columns = [], assignees = [], onChange }) {
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

      <SelectField
        value={filters.columnId}
        onChange={(e) => onChange('columnId', e.target.value)}
        className="w-[190px]"
        selectClassName={`h-12 cursor-pointer rounded-full bg-[var(--colors-canvas-soft)] px-4 pr-11 ${
          filters.columnId === 'Overdue'
            ? 'border-[var(--colors-priority-urgent)] text-[var(--colors-priority-urgent)] focus:border-[var(--colors-priority-urgent)]'
            : 'text-[var(--colors-body)]'
        }`}
        aria-label="Filter by column"
      >
        <option value="">All Columns</option>
        {columns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
        <option value="Overdue">Overdue</option>
      </SelectField>

      <SelectField
        value={filters.assigneeId}
        onChange={(e) => onChange('assigneeId', e.target.value)}
        className="w-[190px]"
        selectClassName="h-12 cursor-pointer rounded-full bg-[var(--colors-canvas-soft)] px-4 pr-11 text-[var(--colors-body)]"
        aria-label="Filter by assignee"
      >
        <option value="">All Assignees</option>
        {assignees.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
      </SelectField>

      <SelectField
        value={filters.priority}
        onChange={(e) => onChange('priority', e.target.value)}
        className="w-[190px]"
        selectClassName="h-12 cursor-pointer rounded-full bg-[var(--colors-canvas-soft)] px-4 pr-11 text-[var(--colors-body)]"
        aria-label="Filter by priority"
      >
        <option value="">All Priorities</option>
        {TASK_PRIORITY_LIST.map((priority) => <option key={priority}>{priority}</option>)}
      </SelectField>

      <SelectField
        value={filters.sortBy || 'Newest First'}
        onChange={(e) => onChange('sortBy', e.target.value)}
        className="w-[190px]"
        selectClassName="h-12 cursor-pointer rounded-full bg-[var(--colors-canvas-soft)] px-4 pr-11 text-[var(--colors-body)] font-medium text-[var(--colors-primary)]"
        aria-label="Sort by"
      >
        <option value="Newest First">Sort: Newest First</option>
        <option value="Oldest First">Sort: Oldest First</option>
        <option value="Highest Priority">Sort: Highest Priority</option>
        <option value="Lowest Priority">Sort: Lowest Priority</option>
        <option value="Due Date (Earliest)">Sort: Due Date (Earliest)</option>
        <option value="Due Date (Latest)">Sort: Due Date (Latest)</option>
      </SelectField>

      {(filters.search || filters.columnId || filters.assigneeId || filters.priority || (filters.sortBy && filters.sortBy !== 'Newest First')) && (
        <button
          onClick={() => { onChange('search', ''); onChange('columnId', ''); onChange('assigneeId', ''); onChange('priority', ''); onChange('sortBy', 'Newest First'); }}
          className="h-12 rounded-full px-4 text-xs font-semibold text-[var(--colors-mute)] transition hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-body)] focus-ring"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
