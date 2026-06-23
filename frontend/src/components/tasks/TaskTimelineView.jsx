/**
 * @file TaskTimelineView.jsx
 * @description Horizontal timeline/Gantt chart view for tracking tasks over days of the month.
 */
import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { getStatusColor, getTaskColumnName, cn } from '../../utils/helpers';

const DAY_WIDTH = 40; // width of day column in px

export default function TaskTimelineView({ tasks, columns = [], onTaskClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [groupBy, setGroupBy] = useState('column');

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group definitions
  const columnGroups = Array.from(new Set([
    ...columns.map((column) => column.name),
    ...tasks.map(getTaskColumnName),
  ])).filter(Boolean);
  const priorityGroups = ['Urgent', 'High', 'Medium', 'Low'];
  const activeGroups = groupBy === 'column' ? columnGroups : priorityGroups;

  // Function to filter tasks belonging to a specific group
  const getTasksInGroup = (group) => {
    return tasks.filter((t) => {
      if (groupBy === 'column') {
        return getTaskColumnName(t) === group;
      } else {
        // Priority check
        return (t.priority || 'Medium') === group;
      }
    });
  };

  // Helper to calculate coordinates for Gantt bar
  const getBarCoordinates = (task, daysList) => {
    if (!task.createdAt) return null;

    const taskStart = new Date(task.createdAt);
    const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(taskStart);

    let startIdx = -1;
    let endIdx = -1;

    // Set day times for comparison
    const compareStart = new Date(taskStart);
    compareStart.setHours(0, 0, 0, 0);

    const compareEnd = new Date(taskEnd);
    compareEnd.setHours(23, 59, 59, 999);

    for (let i = 0; i < daysList.length; i++) {
      const day = daysList[i];
      const dayTime = day.getTime();

      if (dayTime >= compareStart.getTime() && dayTime <= compareEnd.getTime()) {
        if (startIdx === -1) startIdx = i;
        endIdx = i;
      }
    }

    if (startIdx === -1) return null; // No overlap with this month
    return { startIdx, endIdx };
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden animate-in">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-[16px] font-bold text-[var(--colors-ink)]">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-3 h-8 text-[12px] font-semibold rounded-[var(--radius-md)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-secondary)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Group By selector */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--colors-ink-muted)]">Group By:</span>
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-[12px] font-bold rounded-[var(--radius-md)] bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] outline-none focus-ring appearance-none cursor-pointer"
            >
              <option value="column">Column</option>
              <option value="priority">Priority</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 overflow-auto bg-[var(--colors-canvas-soft)] relative">
        <div className="min-w-max flex flex-col h-full">
          {/* Header Row */}
          <div className="flex shrink-0 h-12 sticky top-0 z-20 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)]">
            {/* Left Header Spacer */}
            <div className="w-60 shrink-0 sticky left-0 z-30 bg-[var(--colors-canvas-soft)] border-r border-[var(--colors-hairline)] flex items-center px-4 text-[11px] font-semibold text-[var(--colors-ink-muted)] uppercase tracking-wider">
              Task Name
            </div>
            {/* Right Days Header */}
            <div className="flex flex-1 min-w-max">
              {days.map((day) => (
                <div
                  key={day.toString()}
                  className="flex flex-col items-center justify-center text-[10px] select-none shrink-0"
                  style={{ width: `${DAY_WIDTH}px` }}
                >
                  <span className="font-semibold text-[var(--colors-ink-muted)]">
                    {format(day, 'E')[0]}
                  </span>
                  <span className={cn(
                     "font-bold mt-0.5 w-5 h-5 flex items-center justify-center rounded-full text-[10px]",
                     isToday(day) ? "bg-[var(--colors-primary)] text-[var(--colors-on-primary)]" : "text-[var(--colors-ink)]"
                  )}>
                     {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Grid Body */}
          <div className="flex-1 flex flex-col min-w-max">
            {activeGroups.map((group) => {
              const groupTasks = getTasksInGroup(group);

              return (
                <React.Fragment key={group}>
                  {/* Group Header Row */}
                  <div className="flex h-9 bg-[var(--colors-canvas-soft)] border-b border-[var(--colors-hairline)] sticky z-10">
                    <div className="w-60 shrink-0 sticky left-0 z-10 bg-[var(--colors-canvas-soft)] border-r border-[var(--colors-hairline)] flex items-center px-4 font-bold text-[12px] text-[var(--colors-ink-secondary)]">
                      {group}
                      <span className="ml-2 text-[10px] px-1.5 py-0.2 bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-muted)] rounded-full font-medium">
                        {groupTasks.length}
                      </span>
                    </div>
                    <div className="flex-1 flex min-w-max">
                      {days.map((day) => (
                        <div
                          key={day.toString()}
                          style={{ width: `${DAY_WIDTH}px` }}
                          className="h-full border-r border-[var(--colors-hairline)] opacity-10 shrink-0"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Task Rows */}
                  {groupTasks.length === 0 ? (
                    <div className="flex h-10 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] items-center">
                      <div className="w-60 shrink-0 sticky left-0 z-10 bg-[var(--colors-canvas)] border-r border-[var(--colors-hairline)] flex items-center px-6 text-[11px] text-[var(--colors-ink-faint)] italic">
                        No tasks in this group
                      </div>
                      <div className="flex-1 flex min-w-max">
                        {days.map((day) => (
                          <div
                            key={day.toString()}
                            style={{ width: `${DAY_WIDTH}px` }}
                            className="h-full border-r border-[var(--colors-hairline)] opacity-20 shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    groupTasks.map((task) => {
                      const coords = getBarCoordinates(task, days);
                      const columnName = getTaskColumnName(task);

                      return (
                        <div
                          key={task._id}
                          className="flex h-12 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] hover:bg-[var(--colors-canvas-soft)] transition-colors relative"
                        >
                          {/* Task Name Sticky Column */}
                          <div className="w-60 shrink-0 sticky left-0 z-10 bg-[var(--colors-canvas)] border-r border-[var(--colors-hairline)] group-hover:bg-[var(--colors-canvas-soft)] flex items-center px-6 text-[12px] font-medium text-[var(--colors-ink)] truncate pr-4">
                            <span className="truncate" title={task.title}>{task.title}</span>
                          </div>

                          {/* Days Grid Columns */}
                          <div className="flex-1 flex min-w-max relative">
                            {days.map((day) => {
                              const isDayToday = isToday(day);
                              return (
                                <div
                                  key={day.toString()}
                                  style={{ width: `${DAY_WIDTH}px` }}
                                  className={cn(
                                    "h-full border-r border-[var(--colors-hairline)] opacity-30 shrink-0",
                                    isDayToday ? "bg-[var(--colors-primary-glow)]" : ""
                                  )}
                                />
                              );
                            })}

                            {/* Gantt Bar Overlay */}
                            {coords && (
                              <button
                                onClick={() => onTaskClick?.(task)}
                                className={cn(
                                  "absolute top-2 h-8 rounded-[var(--radius-sm)] shadow-sm text-left truncate flex items-center px-3 border border-[var(--colors-hairline)] cursor-pointer hover:opacity-90 transition-all font-medium text-[11px] overflow-hidden",
                                  getStatusColor(columnName),
                                  task.priority === 'Urgent' ? 'border-l-4 border-l-[var(--colors-priority-urgent)]' :
                                  task.priority === 'High' ? 'border-l-4 border-l-[var(--colors-priority-high)]' :
                                  task.priority === 'Medium' ? 'border-l-4 border-l-[var(--colors-priority-medium)]' :
                                  'border-l-4 border-l-[var(--colors-priority-low)]'
                                )}
                                style={{
                                  left: `${coords.startIdx * DAY_WIDTH + 4}px`,
                                  width: `${(coords.endIdx - coords.startIdx + 1) * DAY_WIDTH - 8}px`,
                                }}
                                title={`${task.title} | Priority: ${task.priority} | Column: ${columnName}`}
                              >
                                <span className="truncate text-[var(--colors-ink)] font-semibold">{task.title}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
