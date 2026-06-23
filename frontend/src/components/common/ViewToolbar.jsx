import React from 'react';
import { cn } from '../../utils/helpers';

export default function ViewToolbar({ filters, activeFilters, onFilterChange, viewOptions, activeView, onViewChange, actions }) {
  return (
    <div className="flex items-center gap-2 px-8 py-2.5 border-b border-[var(--colors-hairline)] flex-shrink-0 flex-wrap bg-[var(--colors-canvas-soft)]">
      {/* Left side filters */}
      <div className="flex items-center gap-1.5">
        {filters?.map((f) => {
          const isActive = activeFilters?.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={cn(
                "flex items-center gap-1.5 border rounded-[6px] px-2.5 py-1 text-[12.5px] transition-colors focus-ring",
                isActive 
                  ? "border-[var(--colors-primary)] text-[var(--colors-primary-active)] bg-[rgba(117,238,143,0.1)]" 
                  : "bg-[var(--colors-canvas)] border-[var(--colors-hairline)] text-[var(--colors-ink-muted)] hover:border-[var(--colors-ink-faint)] hover:text-[var(--colors-ink)]"
              )}
            >
              {f.icon && <span className="text-[13px]">{f.icon}</span>}
              {f.label}
            </button>
          );
        })}
      </div>

      {(filters?.length > 0 && actions?.length > 0) && (
        <div className="w-[1px] h-5 bg-[var(--colors-hairline)] mx-1" />
      )}

      {/* Middle Custom Actions */}
      <div className="flex items-center gap-1.5">
        {actions}
      </div>

      {/* Right View Toggles */}
      {viewOptions && viewOptions.length > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded-[6px] overflow-hidden shadow-sm">
            {viewOptions.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onViewChange?.(v.id)}
                  className={cn(
                    "px-3 py-1 text-[13px] transition-colors focus-ring",
                    isActive
                      ? "bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)] font-medium"
                      : "text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)]"
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
