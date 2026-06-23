import React from 'react';
import { cn } from '../../utils/helpers';

export default function ViewHeader({ icon, title, subtitle, tabs, activeTab, onTabChange }) {
  return (
    <div className="pt-6 px-8 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] flex-shrink-0">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-2xl">{icon}</div>}
        <div>
          <h2 className="text-[18px] font-bold text-[var(--colors-ink)]">{title}</h2>
          {subtitle && <p className="text-[13px] text-[var(--colors-ink-muted)]">{subtitle}</p>}
        </div>
      </div>
      
      {tabs && tabs.length > 0 && (
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "px-4 py-2 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-2",
                  isActive 
                    ? "border-[var(--colors-primary)] text-[var(--colors-ink)]" 
                    : "border-transparent text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] hover:border-[var(--colors-hairline)]"
                )}
              >
                {tab.icon && <span className="text-[14px]">{tab.icon}</span>}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
