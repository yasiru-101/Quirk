/**
 * @file KanbanBoard.jsx
 * @description Task board organizer rendering columns for "To Do", "In Progress", and "Completed".
 */
import React from 'react';
import KanbanColumn from './KanbanColumn';
import { TASK_STATUS_LIST } from '../../utils/constants';

/**
 * Container that clusters a flat collection of task elements into columns by status.
 * Uses a horizontal scrolling flex layout matching the design system specifications.
 *
 * @param {object[]} props.tasks - Flat arrays of tasks
 * @param {Function} props.onStatusChange - Callback changing task status values
 * @param {Function} props.onCardClick - Action when selecting a task card
 * @param {Function} props.onDelete - Action deleting task cards (exclusive to Project Managers)
 */
export default function KanbanBoard({ tasks, onStatusChange, onCardClick, onDelete }) {
  const grouped = TASK_STATUS_LIST.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="kanban-board">
      {TASK_STATUS_LIST.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={grouped[status]}
          onStatusChange={onStatusChange}
          onCardClick={onCardClick}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
