import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/helpers';

export default function Dropdown({
  value,
  onChange,
  options, // Array of { label, value } or strings
  placeholder = 'Select option',
  className,
  buttonClassName,
  menuClassName,
  itemClassName,
  activeItemClassName,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    // Close on Escape so keyboard users can dismiss the menu without a pointer.
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div ref={ref} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-2 h-10 rounded-[var(--radius-md)] border bg-[var(--colors-canvas-soft)] px-3 text-sm font-semibold text-[var(--colors-ink)] transition-all focus-ring',
          open ? 'border-[var(--colors-primary)] bg-[var(--colors-canvas)] shadow-md' : 'border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-mid)]',
          buttonClassName
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className="flex-shrink-0 text-[var(--colors-mute)] transition-transform duration-200" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={cn(
          'absolute z-[60] mt-1.5 max-h-60 w-full min-w-[160px] overflow-auto rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] py-1 shadow-[var(--shadow-card)] animate-in',
          menuClassName
        )}>
          {normalizedOptions.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--colors-primary-glow)] text-[var(--colors-primary-active)] font-semibold'
                    : 'text-[var(--colors-ink)] hover:bg-[var(--colors-canvas-soft)] font-medium',
                  itemClassName,
                  isActive && activeItemClassName
                )}
              >
                {isActive ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="w-[11px]" />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
