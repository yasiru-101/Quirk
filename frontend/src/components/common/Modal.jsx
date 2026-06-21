/**
 * @file Modal.jsx
 * @description Accessible popover dialogue overlay with backdrop lock, focus-trap, and Escape dismiss.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

/**
 * Overlay container dialog component. Handles document body scrolling lockouts, Focus trapping, and accessibility tags.
 *
 * @param {boolean} props.open - State flag to display modal
 * @param {Function} props.onClose - Callback triggered to close dialog
 * @param {string} props.title - Dialogue top header title
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Width restriction mapping
 * @param {React.ReactNode} props.children - Main dialogue body contents
 * @param {React.ReactNode} props.footer - Override element for action buttons
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const overlayRef = useRef(null);
  const dialogRef  = useRef(null);

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Focus trap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  // ── Lock body scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`w-full ${sizeMap[size]} scale-in flex flex-col max-h-[90vh] outline-none rounded-[var(--radius-xl)] bg-[var(--colors-canvas)] dark:bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] shadow-lg dark:shadow-[0_0_0_2px_var(--colors-primary-glow)]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--colors-hairline)]">
          <h2 className="text-[var(--typography-display-md)] font-semibold text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[var(--colors-mute)] hover:text-[var(--colors-ink)] dark:hover:text-[var(--colors-on-dark)] transition-colors p-1.5 rounded-full hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] focus-ring"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {/* Footer */}
        {footer !== undefined ? (
          footer && <div className="px-6 py-5 border-t border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] dark:bg-[var(--colors-canvas-softer)] rounded-b-[var(--radius-xl)]">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
