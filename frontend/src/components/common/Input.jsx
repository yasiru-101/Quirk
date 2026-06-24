/**
 * @file Input.jsx
 * @description Customized text input and textarea component for the shared design system.
 */
import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Custom text inputs or textareas featuring hints and icon placements.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    type = 'text',
    leftIcon,
    rightIcon,
    className,
    id,
    rows = 3,
    ...rest
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;
  const isTextarea = type === 'textarea';
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseInput = cn(
    'w-full bg-[var(--colors-canvas-softer)] border border-[var(--colors-hairline)] text-[length:var(--typography-body-md)] text-[var(--colors-ink)] rounded-[var(--radius-md)] outline-none transition-all focus-ring placeholder:text-[var(--colors-mute)]',
    error
      ? 'border-[var(--colors-priority-urgent)] focus:border-[var(--colors-priority-urgent)] focus:ring-[var(--colors-priority-urgent)]'
      : 'hover:border-[var(--colors-hairline-mid)] focus:border-[var(--colors-primary)] focus:bg-[var(--colors-canvas)] focus:shadow-md',
    leftIcon  ? 'pl-11' : 'pl-4',
    rightIcon ? 'pr-11' : 'pr-4',
    isTextarea ? 'py-3 resize-none' : 'h-12',
    className
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[length:var(--typography-body-sm)] font-semibold text-[var(--colors-ink)] ml-1"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {leftIcon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--colors-mute)] group-focus-within:text-[var(--colors-primary)] transition-colors pointer-events-none">
            {leftIcon}
          </span>
        )}

        {isTextarea ? (
          <textarea id={inputId} ref={ref} rows={rows} className={baseInput} {...rest} />
        ) : (
          <input id={inputId} type={inputType} ref={ref} className={baseInput} {...rest} />
        )}

        {isPassword && !rightIcon && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--colors-mute)] hover:text-[var(--colors-ink)] transition-colors focus-ring rounded-full p-1"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}

        {rightIcon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--colors-mute)]">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[length:var(--typography-caption)] text-[var(--colors-priority-urgent)] flex items-center gap-1 font-medium mt-1 ml-1 slide-up">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[length:var(--typography-caption)] text-[var(--colors-mute)] mt-1 ml-1">{hint}</p>
      )}
    </div>
  );
});

export default Input;
