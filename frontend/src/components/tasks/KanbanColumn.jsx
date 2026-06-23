/**
 * @file KanbanColumn.jsx
 * @description Visual column structure for the Kanban dashboard layout.
 */
import React from 'react';
import TaskCard from './TaskCard';
import EmptyState from '../common/EmptyState';
import { ROLES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { InboxIcon, SparklesIcon } from '../common/Icons';
import { isTerminalColumn } from '../../utils/helpers';

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
 * @param {object} props.column - Kanban column metadata
 * @param {object[]} props.tasks - Filtered tasks belonging to column
 * @param {Function} props.onColumnChange - Callback updating card column
 * @param {Function} props.onCardClick - Details popup launcher callback
 * @param {Function} props.onDelete - Card delete callback
 */
export default function KanbanColumn({ column, columns, tasks, onColumnChange, onCardClick, onDelete }) {
  const columnName = column?.name || 'Unassigned';
  const isTerminal = isTerminalColumn(columnName);
  const meta = COLUMN_META[columnName] ?? { colorVar: 'var(--colors-mute)' };
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER;

  return (
    <div className="kanban-col">
      {/* Column header */}
      <div className="kanban-col-header">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.colorVar }} />
        <span>{columnName}</span>
        <span className="col-count">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div 
        className="kanban-cards"
        onDragOver={(e) => {
          e.preventDefault(); // necessary to allow dropping
          e.currentTarget.classList.add('bg-[var(--colors-canvas-soft)]');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('bg-[var(--colors-canvas-soft)]');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('bg-[var(--colors-canvas-soft)]');
          const taskId = e.dataTransfer.getData('taskId');
          if (taskId && onColumnChange) {
            onColumnChange(taskId, column.id);
          }
        }}
      >
        {tasks.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              icon={isTerminal ? <SparklesIcon className="w-6 h-6 text-[var(--colors-mute)]" /> : <InboxIcon className="w-6 h-6 text-[var(--colors-mute)]" />}
              title={isTerminal ? 'Nothing done yet' : 'Empty column'}
              description={
                columnName === 'To Do' || columnName === 'Backlog'
                  ? isPM
                    ? 'Create a new task to get started.'
                    : 'No tasks assigned here yet.'
                  : columnName === 'In Progress'
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
              columns={columns}
              onColumnChange={onColumnChange}
              onClick={() => onCardClick?.(task)}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
