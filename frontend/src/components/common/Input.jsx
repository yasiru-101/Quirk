/**
 * @file Input.jsx
 * @description Customized text input and textarea component adhering to the Mint & Ink design system.
 */
import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Custom text inputs or textareas featuring inline warning banners, hints, and icon placements.
 *
 * @param {string} props.label - Floating title header for input
 * @param {string} props.error - Optional validation error string
 * @param {string} props.hint - Small info label text below the field
 * @param {string} props.type - Element type (text, email, password, textarea, etc.)
 * @param {React.ReactNode} props.leftIcon - Inline decorative left icon
 * @param {React.ReactNode} props.rightIcon - Inline decorative right icon
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
    'w-full bg-[var(--colors-canvas-softer)] border text-[var(--typography-body-md)] text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)] rounded-[var(--radius-lg)] outline-none transition-colors focus-ring placeholder-[var(--colors-mute)]',
    error
      ? 'border-[var(--colors-priority-urgent)] focus:border-[var(--colors-priority-urgent)]'
      : 'border-[var(--colors-hairline)] focus:border-[var(--colors-primary)]',
    leftIcon  ? 'pl-10' : 'pl-4',
    rightIcon ? 'pr-10' : 'pr-4',
    isTextarea ? 'py-3 resize-none' : 'h-11',
    className
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[var(--typography-body-sm-strong)] font-semibold text-[var(--colors-body)] dark:text-[var(--colors-on-dark-body)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--colors-mute)] pointer-events-none">
            {leftIcon}
          </span>
        )}

        {isTextarea ? (
          <textarea id={inputId} ref={ref} rows={rows} className={baseInput} {...rest} />
        ) : (
          <input id={inputId} type={type} ref={ref} className={baseInput} {...rest} />
        )}

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--colors-mute)]">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[var(--typography-caption)] text-[var(--colors-priority-urgent)] flex items-center gap-1 font-medium mt-0.5">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[var(--typography-caption)] text-[var(--colors-mute)] mt-0.5">{hint}</p>
      )}
    </div>
  );
});

export default Input;
