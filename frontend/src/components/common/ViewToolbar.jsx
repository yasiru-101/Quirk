import React from 'react';
import { cn } from '../../utils/helpers';

export default function ViewToolbar({ filters, activeFilters, onFilterChange, viewOptions, activeView, onViewChange, actions }) {
  return (
    <div className="flex items-center gap-2 px-8 py-3 border-b border-[var(--colors-hairline)] flex-shrink-0 flex-wrap bg-[var(--colors-canvas)]">
      <div className="flex items-center gap-1.5">
        {filters?.map((f) => {
          const isActive = activeFilters?.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={cn(
                "flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-ring",
                isActive 
                  ? "border-[var(--colors-primary)] text-[var(--colors-primary-active)] bg-[rgba(117,238,143,0.1)]" 
                  : "bg-[var(--colors-canvas)] border-[var(--colors-hairline)] text-[var(--colors-ink-muted)] hover:border-[var(--colors-ink-faint)] hover:text-[var(--colors-ink)]"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {(filters?.length > 0 && actions?.length > 0) && (
        <div className="w-[1px] h-5 bg-[var(--colors-hairline)] mx-1" />
      )}

      <div className="flex items-center gap-1.5">
        {actions}
      </div>

      {viewOptions && viewOptions.length > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] rounded-full overflow-hidden p-1">
            {viewOptions.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onViewChange?.(v.id)}
                  className={cn(
                    "px-3 py-1.5 text-[13px] rounded-full transition-colors focus-ring",
                    isActive
                      ? "bg-[var(--colors-canvas)] text-[var(--colors-ink)] font-semibold shadow-sm"
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
