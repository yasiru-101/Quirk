/**
 * @file KanbanColumn.jsx
 * @description Visual column structure for the Kanban dashboard layout.
 */
import React from 'react';
import TaskCard from './TaskCard';
import EmptyState from '../common/EmptyState';
import { ROLES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const COLUMN_META = {
  'Backlog':     { colorVar: 'var(--colors-mute)' },
  'To Do':       { colorVar: 'var(--colors-priority-low)' },
  'In Progress': { colorVar: 'var(--colors-priority-medium)' },
  'In Review':   { colorVar: 'var(--colors-priority-high)' },
  'Completed':   { colorVar: 'var(--colors-primary)' },
};

/**
 * Column renderer mapping card arrays inside column categories. Displays total counts 
 * and presents empty states.
 *
 * @param {string} props.status - Status category of the column
 * @param {object[]} props.tasks - Filtered tasks belonging to column status
 * @param {Function} props.onStatusChange - Callback updating card status
 * @param {Function} props.onCardClick - Details popup launcher callback
 * @param {Function} props.onDelete - Card delete callback
 */
export default function KanbanColumn({ status, tasks, onStatusChange, onCardClick, onDelete }) {
  const meta = COLUMN_META[status] ?? { colorVar: 'var(--colors-mute)' };
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;

  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] bg-[var(--colors-canvas-softer)] min-h-[500px] w-[var(--board-col-width)] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.colorVar }} />
        <span className="text-[var(--typography-body-sm-strong)] font-semibold text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] uppercase tracking-wider">{status}</span>
        <span className="ml-auto text-[10px] text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] font-medium bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-3">
        {tasks.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              icon={status === 'Completed' ? '🎉' : '📭'}
              title={status === 'Completed' ? 'Nothing done yet' : 'Empty column'}
              description={
                status === 'To Do' || status === 'Backlog'
                  ? isPM
                    ? 'Create a new task to get started.'
                    : 'No tasks assigned here yet.'
                  : status === 'In Progress'
                  ? 'Tasks being worked on will appear here.'
                  : 'Completed tasks will show up here.'
              }
            />
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
              onClick={() => onCardClick?.(task)}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
