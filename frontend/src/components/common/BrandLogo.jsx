/**
 * @file BrandLogo.jsx
 * @description Reusable logo component that renders the brand icon alongside the app name.
 */
import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Reusable brand mark — uses the same favicon.svg that appears in the browser tab,
 * so the icon is pixel-perfect identical everywhere on the site.
 *
 * @param {'sm'|'md'|'lg'} size  - controls icon dimensions
 * @param {boolean} showText     - whether to render the "Quirk" wordmark beside the icon
 * @param {string} className     - extra classes for the wrapper
 */
/**
 * Renders the standard Quirk logo and text wordmark.
 * Uses the favicon file to maintain design consistency with the browser tab.
 *
 * @param {'sm'|'md'|'lg'} props.size - Dimension variant of the logo
 * @param {boolean} props.showText - Toggle display of the "Quirk" name
 * @param {string} props.className - Extraneous style classes
 */
export default function BrandLogo({ size = 'md', showText = true, className }) {
  const iconSize = { sm: 'w-6 h-6', md: 'w-7 h-7', lg: 'w-9 h-9' }[size];
  const textSize = { sm: 'text-sm',  md: 'text-sm',  lg: 'text-xl'  }[size];

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <img
        src="/favicon.svg"
        alt="Quirk logo"
        className={cn(iconSize, 'flex-shrink-0')}
        draggable={false}
      />
      {showText && (
        <span className={cn('font-semibold text-zinc-100 tracking-tight whitespace-nowrap', textSize)}>
          Quirk
        </span>
      )}
    </span>
  );
}
