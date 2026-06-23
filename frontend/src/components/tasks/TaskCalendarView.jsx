/**
 * @file TaskCalendarView.jsx
 * @description Month-grid calendar view mapping tasks to their due dates.
 */
import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { getStatusColor, getTaskColumnName, cn } from '../../utils/helpers';

export default function TaskCalendarView({ tasks, onTaskClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full w-full bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden animate-in">
      {/* Calendar Header / Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shrink-0">
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

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--colors-canvas-soft)]">
        {/* Days of the Week Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shrink-0">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[11px] font-semibold text-[var(--colors-ink-muted)] tracking-wider uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(132px,auto)] gap-[1px] bg-[var(--colors-hairline)] overflow-auto">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const dayTasks = tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day));

            return (
              <div
                key={idx}
                className={cn(
                  "flex min-h-[132px] flex-col p-2 transition-colors relative group",
                  isCurrentMonth ? "bg-[var(--colors-canvas)]" : "bg-[var(--colors-canvas-soft)] opacity-70"
                )}
              >
                {/* Date Cell Header */}
                <div className="flex items-center justify-between mb-1 shrink-0">
                  <span
                    className={cn(
                      "text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isDayToday 
                        ? "bg-[var(--colors-primary)] text-[var(--colors-on-primary)] font-bold shadow-sm" 
                        : isCurrentMonth ? "text-[var(--colors-ink)]" : "text-[var(--colors-ink-faint)]"
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-[var(--colors-ink-muted)] px-1.5 py-0.2 bg-[var(--colors-surface-pressed)] rounded-full">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks container in the Day cell */}
                <div className="flex-1 space-y-1 pr-0.5">
                  {dayTasks.map((task) => {
                    const columnName = getTaskColumnName(task);
                    return (
                      <button
                        key={task._id}
                        onClick={() => onTaskClick?.(task)}
                        className={cn(
                          "block w-full cursor-pointer rounded-[var(--radius-sm)] border border-[var(--colors-hairline)] px-2 py-1.5 text-left text-[11px] leading-snug transition-all hover:scale-[0.98] active:scale-[0.96]",
                          getStatusColor(columnName)
                        )}
                        title={`${task.title} (${columnName})`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0",
                            task.priority === 'Urgent' ? 'bg-[var(--colors-priority-urgent)]' :
                            task.priority === 'High' ? 'bg-[var(--colors-priority-high)]' :
                            task.priority === 'Medium' ? 'bg-[var(--colors-priority-medium)]' :
                            'bg-[var(--colors-priority-low)]'
                          )} />
                          <span className="min-w-0 whitespace-normal break-words font-medium text-[var(--colors-ink)]">{task.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
