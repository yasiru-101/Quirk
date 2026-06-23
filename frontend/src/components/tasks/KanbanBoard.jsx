/**
 * @file KanbanBoard.jsx
 * @description Task board organizer rendering project workflow columns.
 */
import React from 'react';
import KanbanColumn from './KanbanColumn';

/**
 * Container that clusters a flat collection of task elements into Kanban columns.
 * Uses a horizontal scrolling flex layout matching the design system specifications.
 *
 * @param {object[]} props.tasks - Flat arrays of tasks
 * @param {object[]} props.columns - Project Kanban columns
 * @param {Function} props.onColumnChange - Callback changing task column
 * @param {Function} props.onCardClick - Action when selecting a task card
 * @param {Function} props.onDelete - Action deleting task cards (exclusive to Project Managers)
 */
export default function KanbanBoard({ tasks, columns, onColumnChange, onCardClick, onDelete }) {
  const grouped = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((t) => t.columnId === column.id);
    return acc;
  }, {});

  return (
    <div className="kanban-board">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          columns={columns}
          tasks={grouped[column.id] ?? []}
          onColumnChange={onColumnChange}
          onCardClick={onCardClick}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
