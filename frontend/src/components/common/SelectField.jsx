/**
 * @file SelectField.jsx
 * @description Shared select control with consistent Quirk dropdown spacing.
 */
import React from 'react';
import { cn } from '../../utils/helpers';

export default function SelectField({
  label,
  error,
  className,
  selectClassName,
  children,
  disabled,
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-sm font-semibold text-[var(--colors-ink)]">{label}</label>}
      <div className="relative">
        <select
          disabled={disabled}
          className={cn(
            'h-11 w-full appearance-none rounded-[var(--radius-md)] border bg-[var(--colors-canvas-soft)] px-3 pr-11 text-sm font-semibold text-[var(--colors-ink)] outline-none transition-all focus-ring focus:border-[var(--colors-primary)] disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500 focus:border-red-500' : 'border-[var(--colors-hairline)]',
            selectClassName
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--colors-mute)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
