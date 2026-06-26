/**
 * @file SelectField.jsx
 * @description Custom theme-aware select dropdown — no native <select> so it
 * renders consistently in both light and dark mode.
 *
 * Props:
 *   label        – optional label above the control
 *   error        – optional error message below
 *   disabled     – greys out and prevents interaction
 *   name         – forwarded in the synthetic onChange event as e.target.name
 *   value        – currently selected value
 *   onChange     – called with { target: { name, value } } to match native-input
 *                  handler conventions used throughout the codebase
 *   options      – array of { value, label }  (preferred)
 *   children     – <option> elements (backward-compat with TaskModal usage)
 *   placeholder  – shown when no value is selected
 *   className    – outer wrapper class
 *   variant      – 'default' | 'pill'  (pill = compact rounded-full badge style)
 *   triggerClassName – extra classes applied to the trigger button
 */
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/helpers';

export default function SelectField({
  label,
  error,
  className,
  disabled,
  name,
  value,
  onChange,
  options,
  children,
  placeholder,
  variant = 'default',
  triggerClassName,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Normalise options from either the `options` prop or <option> children.
  const normalizedOptions = options
    ? options
    : React.Children.toArray(children)
        .filter((c) => c.type === 'option')
        .map((c) => ({
          value: c.props.value !== undefined ? c.props.value : c.props.children,
          label: c.props.children,
        }));

  const selected = normalizedOptions.find((o) => String(o.value) === String(value ?? ''));

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const pick = (optValue) => {
    if (disabled) return;
    onChange?.({ target: { name: name ?? '', value: optValue } });
    setOpen(false);
  };

  const isPill = variant === 'pill';

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={ref}>
      {label && !isPill && (
        <label className="text-sm font-semibold text-[var(--colors-ink)]">{label}</label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex w-full items-center justify-between gap-2 outline-none transition-all focus-ring',
            isPill
              ? 'rounded-full border px-3 py-1.5 text-[12px] font-bold'
              : 'h-11 rounded-[var(--radius-md)] border bg-[var(--colors-canvas-soft)] px-3 text-sm font-semibold text-[var(--colors-ink)]',
            !isPill && (
              error
                ? 'border-red-500 focus:border-red-500'
                : open
                ? 'border-[var(--colors-primary)] bg-[var(--colors-canvas)] shadow-md'
                : 'border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-mid)]'
            ),
            isPill && (
              open
                ? 'border-[var(--colors-primary)]'
                : 'border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-mid)]'
            ),
            disabled && 'cursor-not-allowed opacity-50',
            triggerClassName,
          )}
        >
          <span className={cn('truncate', !selected && !isPill && 'text-[var(--colors-mute)]')}>
            {selected?.label ?? placeholder ?? 'Select…'}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'shrink-0 transition-transform duration-150',
              isPill ? 'opacity-50' : 'text-[var(--colors-mute)]',
              open && 'rotate-180',
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {open && !disabled && (
          <div
            role="listbox"
            className="absolute z-[60] mt-1.5 w-full min-w-[140px] overflow-auto rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] py-1 shadow-[var(--shadow-card)] max-h-60 animate-in"
          >
            {normalizedOptions.map((opt) => {
              const isActive = String(opt.value) === String(value ?? '');
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    isActive
                      ? 'bg-[var(--colors-primary-glow)] text-[var(--colors-primary-active)] font-semibold'
                      : 'text-[var(--colors-ink)] hover:bg-[var(--colors-canvas-soft)] font-medium',
                  )}
                >
                  {isActive ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="w-[11px]" />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && !isPill && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
