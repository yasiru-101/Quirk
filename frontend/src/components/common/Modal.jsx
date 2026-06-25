/**
 * @file Modal.jsx
 * @description Accessible dialog overlay with backdrop lock and restrained motion.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Overlay container dialog component.
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const overlayRef = useRef(null);
  const dialogRef  = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Trap Tab focus inside the dialog so keyboard users can't reach the
      // inert content behind the modal.
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      // Remember what had focus so it can be restored when the dialog closes,
      // then move focus into the dialog.
      lastFocusedRef.current = document.activeElement;
      dialogRef.current?.focus();
      return () => {
        const toRestore = lastFocusedRef.current;
        if (toRestore && typeof toRestore.focus === 'function') toRestore.focus();
      };
    }
  }, [open]);

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
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`w-full ${sizeMap[size]} scale-in flex flex-col max-h-[90vh] outline-none card shadow-[var(--shadow-modal)] overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--colors-hairline)]">
          <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[var(--colors-mute)] hover:text-[var(--colors-ink)] transition-colors p-2 rounded-full hover:bg-[var(--colors-canvas-softer)] focus-ring active:scale-95"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer !== undefined ? (
          footer && <div className="px-6 py-5 border-t border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] rounded-b-[var(--radius-xl)]">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
