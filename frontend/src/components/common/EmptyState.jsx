/**
 * @file EmptyState.jsx
 * @description Placeholder component used when search yields no result or columns are empty.
 */
import React from 'react';

/**
 * Centered empty state with icon, headline, sub-copy, and optional CTA.
 */
/**
 * Renders a descriptive placeholder illustration, message, and call-to-action button.
 *
 * @param {React.ReactNode} props.icon - Graphic or emoji shown as visual cue
 * @param {string} props.title - Main headline message
 * @param {string} props.description - Detailed contextual explanation
 * @param {React.ReactNode} props.action - Optional action button component
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-hairline flex items-center justify-center text-2xl mb-5 ring-1 ring-surface-pressed/50">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-mute max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
