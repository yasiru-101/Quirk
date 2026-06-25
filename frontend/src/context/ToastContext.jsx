/**
 * @file ToastContext.jsx
 * @description Alert notification system managing overlays, timeouts, and styling classes.
 */
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { TOAST_DURATION } from '../utils/constants';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * Application notification toast provider. Maintains stack states, manages auto-dismiss timeouts,
 * and presents success, info, warning, and error variants.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message, duration }) => {
      const id = `t-${Date.now()}-${Math.random()}`;
      const ttl = duration ?? TOAST_DURATION[type.toUpperCase()] ?? 3500;

      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      timers.current[id] = setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss]
  );

  const success = useCallback((msg, title = 'Success') => toast({ type: 'success', title, message: msg }), [toast]);
  const error   = useCallback((msg, title = 'Error')   => toast({ type: 'error',   title, message: msg }), [toast]);
  const warning = useCallback((msg, title = 'Warning') => toast({ type: 'warning', title, message: msg }), [toast]);
  const info    = useCallback((msg, title = 'Info')    => toast({ type: 'info',    title, message: msg }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

// ─── Single Toast ─────────────────────────────────────────────────────────────
const TOAST_STYLES = {
  success: { bar: 'bg-emerald-500', icon: '✓', iconClass: 'text-emerald-400 bg-emerald-400/10' },
  error:   { bar: 'bg-rose-500',    icon: '✕', iconClass: 'text-rose-400 bg-rose-400/10' },
  warning: { bar: 'bg-amber-500',   icon: '!', iconClass: 'text-amber-400 bg-amber-400/10' },
  info:    { bar: 'bg-indigo-500',  icon: 'i', iconClass: 'text-indigo-400 bg-indigo-400/10' },
};

function ToastItem({ toast, dismiss }) {
  const { type = 'info', title, message, id } = toast;
  const s = TOAST_STYLES[type] ?? TOAST_STYLES.info;

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-start gap-3 p-4 shadow-xl slide-up overflow-hidden relative rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-elevated)]"
    >
      {/* accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${s.bar} rounded-l`} />

      {/* icon */}
      <span
        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold ${s.iconClass}`}
      >
        {s.icon}
      </span>

      {/* text */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-[var(--colors-ink)] leading-snug">{title}</p>
        )}
        {message && (
          <p className="text-xs text-[var(--colors-body)] mt-0.5 leading-relaxed">{message}</p>
        )}
      </div>

      {/* dismiss */}
      <button
        onClick={() => dismiss(id)}
        className="flex-shrink-0 text-[var(--colors-mute)] hover:text-[var(--colors-body)] transition-colors focus-ring rounded p-0.5 hover:bg-[var(--colors-surface-hover)]"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
