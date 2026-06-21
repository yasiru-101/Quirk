/**
 * @file Badge.jsx
 * @description Custom status, role, and priority badge component.
 */
import React from 'react';
import { cn, getRoleBadgeStyle } from '../../utils/helpers';

/**
 * Small pill badge.
 * @param {'role'|'status'|'priority'|'custom'} variant
 */
/**
 * Small pill badge wrapper used to display tags, priorities, status values, and roles.
 *
 * @param {React.ReactNode} props.children - Content of the badge
 * @param {'role'|'status'|'priority'|'custom'} props.variant - Visual variant mapped to classes
 * @param {object} props.style - Inline custom styles
 * @param {string} props.className - Tailwind classes for overriding styles
 */
export default function Badge({ children, variant = 'custom', style: customStyle, className }) {
  const base = 'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ring-inset';

  const resolved = variant === 'role'
    ? cn(base, getRoleBadgeStyle(children), className)
    : cn(base, 'text-body bg-body/10 ring-body/20', className);

  return (
    <span className={resolved} style={customStyle}>
      {children}
    </span>
  );
}
