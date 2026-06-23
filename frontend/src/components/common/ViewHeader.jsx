import React from 'react';
import { cn } from '../../utils/helpers';

export default function ViewHeader({ icon, title, subtitle, tabs, activeTab, onTabChange }) {
  const renderIcon = React.isValidElement(icon);

  return (
    <div className="pt-7 px-8 border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas)] flex-shrink-0">
      <div className="flex items-center gap-3 mb-5">
        {renderIcon && <div className="text-[var(--colors-primary-active)]">{icon}</div>}
        <div>
          <h2 className="text-[length:var(--typography-heading-3)] font-semibold text-[var(--colors-ink)]">{title}</h2>
          {subtitle && <p className="text-[length:var(--typography-body-sm)] text-[var(--colors-ink-muted)] mt-1">{subtitle}</p>}
        </div>
      </div>
      
      {tabs && tabs.length > 0 && (
        <div className="flex gap-2 pb-5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "px-4 py-2 text-[13px] font-semibold rounded-full border transition-colors flex items-center gap-2 whitespace-nowrap focus-ring",
                  isActive 
                    ? "border-[var(--colors-primary)] bg-[rgba(114,230,149,0.16)] text-[var(--colors-ink)]" 
                    : "border-[var(--colors-hairline)] bg-[var(--colors-canvas)] text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)] hover:border-[var(--colors-hairline-mid)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
