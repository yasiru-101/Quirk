/**
 * @file TaskFilters.jsx
 * @description Horizontal workspace toolbar containing search and filter controls.
 */
import React from 'react';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
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

      <Dropdown
        value={filters.columnId}
        onChange={(val) => onChange('columnId', val)}
        className="w-[190px]"
        buttonClassName={
          filters.columnId === 'Overdue'
            ? 'border border-[var(--colors-priority-urgent)] text-[var(--colors-priority-urgent)] bg-[var(--colors-priority-urgent)]/10'
            : ''
        }
        placeholder="All Columns"
        options={[
          { label: 'All Columns', value: '' },
          ...columns.map(c => ({ label: c.name, value: c.id })),
          { label: 'Overdue', value: 'Overdue' }
        ]}
      />

      <Dropdown
        value={filters.assigneeId}
        onChange={(val) => onChange('assigneeId', val)}
        className="w-[190px]"
        placeholder="All Assignees"
        options={[
          { label: 'All Assignees', value: '' },
          ...assignees.map(u => ({ label: u.name, value: u.id }))
        ]}
      />

      <Dropdown
        value={filters.priority}
        onChange={(val) => onChange('priority', val)}
        className="w-[190px]"
        placeholder="All Priorities"
        options={[
          { label: 'All Priorities', value: '' },
          ...TASK_PRIORITY_LIST.map(p => ({ label: p, value: p }))
        ]}
      />

      <Dropdown
        value={filters.sortBy || 'Newest First'}
        onChange={(val) => onChange('sortBy', val)}
        className="w-[190px]"
        buttonClassName="text-[var(--colors-primary)] font-medium"
        options={[
          { label: 'Sort: Newest First', value: 'Newest First' },
          { label: 'Sort: Oldest First', value: 'Oldest First' },
          { label: 'Sort: Highest Priority', value: 'Highest Priority' },
          { label: 'Sort: Lowest Priority', value: 'Lowest Priority' },
          { label: 'Sort: Due Date (Earliest)', value: 'Due Date (Earliest)' },
          { label: 'Sort: Due Date (Latest)', value: 'Due Date (Latest)' }
        ]}
      />

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
