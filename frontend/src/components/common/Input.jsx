/**
 * @file Input.jsx
 * @description Customized text input and textarea component for the shared design system.
 */
import React, { forwardRef } from 'react';
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
          <input id={inputId} type={type} ref={ref} className={baseInput} {...rest} />
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
