/**
 * @file BrandLogo.jsx
 * @description Reusable logo component that renders the brand icon or full wordmark based on theme.
 */
import React from 'react';
import { cn } from '../../utils/helpers';
import { useTheme } from '../context/ThemeContext';

/**
 * Renders the Quirk logo using the provided webp assets.
 * Flips the wordmark color depending on the active theme polarity.
 *
 * @param {'sm'|'md'|'lg'} props.size - Dimension variant of the logo
 * @param {boolean} props.showText - Toggle display of the full wordmark vs just the icon
 * @param {string} props.className - Extraneous style classes
 */
export default function BrandLogo({ size = 'md', showText = true, className }) {
  const { theme } = useTheme();
  
  const heightClass = {
    sm: 'h-6',
    md: 'h-7',
    lg: 'h-9'
  }[size];

  // In dark mode the canvas is dark, so we need the white text logo.
  // In light mode the canvas is light, so we need the black text logo.
  const fullLogoSrc = theme === 'dark' 
    ? '/full logo - white.webp' 
    : '/full logo - black.webp';
    
  const iconSrc = '/logo icon.webp';

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={showText ? fullLogoSrc : iconSrc}
        alt="Quirk Logo"
        className={cn(heightClass, 'w-auto object-contain flex-shrink-0')}
        draggable={false}
      />
    </div>
  );
}
