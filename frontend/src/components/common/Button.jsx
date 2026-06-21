/**
 * @file Button.jsx
 * @description Modular button component matching the hybrid Mint-Uber design system.
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
    'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-pill)] transition-all focus-ring select-none disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden';

  const variants = {
    primary:
      'bg-[var(--colors-primary)] text-[var(--colors-on-primary)] hover:bg-[var(--colors-primary-deep)] hover:shadow-[0_4px_12px_var(--colors-primary-glow)] active:scale-95',
    secondary:
      'bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] dark:hover:bg-[rgba(255,255,255,0.05)] active:scale-95',
    subtle:
      'bg-[var(--colors-canvas-soft)] text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] dark:bg-[var(--colors-canvas-softer)] dark:hover:bg-[var(--colors-surface-pressed)] active:scale-95',
    icon:
      'bg-transparent text-[var(--colors-mute)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] active:scale-95',
    danger:
      'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20 active:scale-95',
  };

  const sizes = {
    sm: cn('text-sm h-8',  iconOnly ? 'w-8'  : 'px-4'),
    md: cn('text-base h-10',  iconOnly ? 'w-10'  : 'px-6'),
    lg: cn('text-lg h-12', iconOnly ? 'w-12' : 'px-8'),
  };

  const actualSize = variant === 'icon' ? 'md' : size;
  const isIconOnly = variant === 'icon' || iconOnly;

  return (
    <button
      className={cn(base, variants[variant], sizes[actualSize], isIconOnly ? 'p-0' : '', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-[inherit]">
          <Spinner size={actualSize === 'lg' ? 20 : 16} />
        </span>
      )}
      <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
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
