/**
 * @file Button.jsx
 * @description Modular button component matching the Quirk Mint & Ink design system.
 */
import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Button wrapper matching the design system components.
 *
 * @param {React.ReactNode} props.children - Label or content inside button
 * @param {'primary'|'secondary'|'subtle'|'danger'|'icon'} props.variant - Visual variant style
 * @param {'sm'|'md'|'lg'} props.size - Size variant mapping height and padding
 * @param {boolean} props.loading - Shows loading spinner and disables action
 * @param {boolean} props.iconOnly - Adjusts padding for purely icon buttons
 * @param {string} props.className - Overriding classnames
 * @param {boolean} props.disabled - Toggles user interaction
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  className,
  disabled,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all focus-ring select-none disabled:opacity-40 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-[var(--colors-primary)] text-[var(--colors-on-mint)] hover:bg-[var(--colors-primary-deep)] active:opacity-90',
    secondary:
      'bg-[var(--colors-canvas)] text-[var(--colors-ink)] border border-[var(--colors-hairline)] hover:bg-[var(--colors-canvas-soft)] dark:bg-[var(--colors-canvas-soft)] dark:hover:bg-[var(--colors-surface-pressed)]',
    subtle:
      'bg-[var(--colors-canvas-soft)] text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] dark:bg-[var(--colors-canvas-softer)] dark:text-[var(--colors-on-dark)] dark:hover:bg-[var(--colors-surface-pressed)]',
    icon:
      'bg-[var(--colors-canvas-soft)] text-[var(--colors-ink)] hover:bg-[var(--colors-canvas-softer)] dark:text-[var(--colors-on-dark)] dark:hover:shadow-[0_0_0_2px_var(--colors-primary-glow)]',
    danger:
      'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20',
  };

  const sizes = {
    sm: cn('text-sm h-7',  iconOnly ? 'w-7'  : 'px-3'),
    md: cn('text-base h-9',  iconOnly ? 'w-9'  : 'px-4'),
    lg: cn('text-lg h-11', iconOnly ? 'w-11' : 'px-6'),
  };

  const actualSize = variant === 'icon' ? 'md' : size;
  const isIconOnly = variant === 'icon' || iconOnly;

  return (
    <button
      className={cn(base, variants[variant], sizes[actualSize], isIconOnly ? 'p-0' : '', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={actualSize === 'lg' ? 18 : 16} />
          {!isIconOnly && <span>Loading…</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
