/**
 * @file BrandLogo.jsx
 * @description Reusable logo component that renders the brand icon or full wordmark based on theme.
 */
import React from 'react';
import { cn } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

/**
 * Renders the Quirk logo using the provided webp assets.
 */
export default function BrandLogo({ size = 'md', showText = true, variant, className }) {
  const { theme } = useTheme();
  
  const heightClass = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-24'
  }[size] || 'h-10';

  const effectiveVariant = variant || (theme === 'dark' ? 'light' : 'dark');

  const fullLogoSrc = effectiveVariant === 'light' 
    ? '/full logo  - white.webp' 
    : '/full logo - black.webp';
    
  const iconSrc = '/logo icon.webp';

  return (
    <div className={cn('flex items-center overflow-hidden', heightClass, showText ? 'w-[245px]' : 'w-auto', className)}>
      <img
        src={showText ? fullLogoSrc : iconSrc}
        alt="Quirk logo"
        className={cn(
          'h-full max-w-none object-contain object-left transition-transform',
          showText ? 'origin-left scale-[1.35]' : 'w-auto'
        )}
        draggable={false}
      />
    </div>
  );
}
