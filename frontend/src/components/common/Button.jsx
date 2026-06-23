/**
 * @file Button.jsx
 * @description Modular button component matching the Quirk design system.
 */
import React from 'react';
import { cn } from '../../utils/helpers';

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className,
  disabled,
  ...rest
}) {
  const base = 'transition-all focus-ring select-none disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    utility: 'btn-utility',
    'icon-circular': 'btn-icon-circular',
    danger: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20 active:scale-95 rounded-full px-6 py-2.5 font-medium',
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-[inherit]">
          <Spinner size={16} />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
