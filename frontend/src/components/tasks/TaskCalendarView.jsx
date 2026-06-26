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
  isToday,
} from 'date-fns';
import { getStatusColor, getTaskColumnName, getInitials, cn } from '../../utils/helpers';

const PRIORITY_BORDER = {
  Urgent: 'border-l-[var(--colors-priority-urgent)]',
  High:   'border-l-[var(--colors-priority-high)]',
  Medium: 'border-l-[var(--colors-priority-medium)]',
  Low:    'border-l-[var(--colors-priority-low)]',
};

const PRIORITY_DOT = {
  Urgent: 'bg-[var(--colors-priority-urgent)]',
  High:   'bg-[var(--colors-priority-high)]',
  Medium: 'bg-[var(--colors-priority-medium)]',
  Low:    'bg-[var(--colors-priority-low)]',
};

const MAX_VISIBLE = 3;

function TaskChip({ task, onClick }) {
  const columnName = getTaskColumnName(task);
  const borderClass = PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.Low;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn(
        'flex w-full cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border-l-2 border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] px-2 py-1 text-left transition-all hover:shadow-sm hover:border-[var(--colors-primary)] active:scale-[0.98]',
        borderClass
      )}
      title={`${task.title} · ${task.priority} · ${columnName}`}
    >
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-snug text-[var(--colors-ink)]">
        {task.title}
      </span>
      <span className={cn('text-[9px] font-bold shrink-0 rounded-full px-1.5 py-0.5', getStatusColor(columnName))}>
        {columnName}
      </span>
    </button>
  );
}

function DayDetailModal({ date, tasks, onClose, onTaskClick }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[var(--radius-xl)] bg-[var(--colors-canvas)] shadow-[var(--shadow-modal)] flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--colors-hairline)] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--colors-mute)]">
              {format(date, 'EEEE')}
            </p>
            <h3 className="text-[17px] font-bold text-[var(--colors-ink)]">
              {format(date, 'MMMM d, yyyy')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--colors-mute)] bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] px-2 py-0.5 rounded-full">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--colors-mute)] hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-ink)] transition-colors"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tasks.map((task) => {
            const columnName = getTaskColumnName(task);
            const borderClass = PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.Low;
            const dotClass = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.Low;

            return (
              <button
                key={task._id}
                onClick={() => { onClose(); onTaskClick?.(task); }}
                className={cn(
                  'flex w-full cursor-pointer flex-col gap-2 rounded-[var(--radius-lg)] border-l-[3px] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-3 py-3 text-left transition-all hover:shadow-sm hover:border-[var(--colors-primary)] active:scale-[0.99]',
                  borderClass
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-semibold leading-snug text-[var(--colors-ink)]">
                    {task.title}
                  </span>
                  <span className={cn('shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5', getStatusColor(columnName))}>
                    {columnName}
                  </span>
                </div>

                {task.description && (
                  <p className="line-clamp-2 text-[11px] text-[var(--colors-body)] leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', dotClass)} />
                    <span className="text-[11px] font-medium text-[var(--colors-mute)]">{task.priority}</span>
                  </div>
                  {(task.assignees ?? []).length > 0 && (
                    <div className="flex -space-x-1.5">
                      {(task.assignees ?? []).slice(0, 4).map((user) => (
                        <div
                          key={user._id}
                          title={user.name}
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--colors-canvas-soft)] bg-[var(--colors-surface-dark)] text-[8px] font-bold text-white"
                        >
                          {getInitials(user.name)}
                        </div>
                      ))}
                      {(task.assignees ?? []).length > 4 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--colors-canvas-soft)] bg-[var(--colors-surface-pressed)] text-[8px] font-bold text-[var(--colors-ink-muted)]">
                          +{task.assignees.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TaskCalendarView({ tasks, onTaskClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayDetail, setDayDetail] = useState(null); // { date, tasks }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="flex flex-col h-full w-full bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden animate-in">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shrink-0">
          <div>
            <h3 className="text-[16px] font-bold text-[var(--colors-ink)]">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <p className="text-[11px] text-[var(--colors-mute)] mt-0.5">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} with due dates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-3 h-8 text-[12px] font-semibold rounded-[var(--radius-md)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-secondary)] hover:text-[var(--colors-ink)] transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] flex items-center justify-center transition-colors"
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
          {/* Day-of-week headers */}
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
          <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(140px,auto)] gap-[1px] bg-[var(--colors-hairline)] overflow-auto">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);
              const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
              const visibleTasks = dayTasks.slice(0, MAX_VISIBLE);
              const overflow = dayTasks.length - MAX_VISIBLE;

              return (
                <div
                  key={idx}
                  className={cn(
                    'flex min-h-[140px] flex-col p-2 transition-colors',
                    isCurrentMonth ? 'bg-[var(--colors-canvas)]' : 'bg-[var(--colors-canvas-soft)] opacity-60'
                  )}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1.5 shrink-0">
                    <span
                      className={cn(
                        'text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                        isDayToday
                          ? 'bg-[var(--colors-primary)] text-[var(--colors-on-primary)] font-bold shadow-sm'
                          : isCurrentMonth ? 'text-[var(--colors-ink)]' : 'text-[var(--colors-ink-faint)]'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-[var(--colors-ink-muted)] px-1.5 bg-[var(--colors-surface-pressed)] rounded-full leading-5">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task chips */}
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    {visibleTasks.map((task) => (
                      <TaskChip
                        key={task._id}
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                      />
                    ))}

                    {overflow > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDayDetail({ date: day, tasks: dayTasks }); }}
                        className="w-full text-left text-[10px] font-semibold text-[var(--colors-primary)] hover:text-[var(--colors-primary-active)] px-2 py-0.5 rounded hover:bg-[var(--colors-primary-glow)] transition-colors"
                      >
                        +{overflow} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dayDetail && (
        <DayDetailModal
          date={dayDetail.date}
          tasks={dayDetail.tasks}
          onClose={() => setDayDetail(null)}
          onTaskClick={onTaskClick}
        />
      )}
    </>
  );
}
