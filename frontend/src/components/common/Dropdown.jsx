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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          'flex w-full items-center justify-between gap-2 h-12 rounded-full bg-[var(--colors-canvas-soft)] px-4 text-sm text-[var(--colors-body)] transition focus-ring',
          open && 'ring-2 ring-[var(--colors-primary)] border-transparent',
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
          'absolute z-50 mt-2 max-h-60 w-full min-w-[160px] overflow-auto rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-surface-dark-elevated)] p-1.5 shadow-[var(--shadow-floating)] animate-in fade-in zoom-in-95',
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
                  'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-[var(--colors-primary-glow)] text-[var(--colors-primary-active)]' 
                    : 'text-[var(--colors-ink)] hover:bg-[var(--colors-canvas-softer)]',
                  itemClassName,
                  isActive && activeItemClassName
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
