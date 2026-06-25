/**
 * @file ConfirmContext.jsx
 * @description Promise-based confirmation dialog built on the shared Modal, replacing
 * native window.confirm so destructive actions match the app's design system, theme,
 * and accessibility behaviour. Usage:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel: 'Delete', danger: true }))) return;
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setState({
          title: options.title || 'Are you sure?',
          message: options.message || '',
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          danger: options.danger ?? false,
        });
      }),
    []
  );

  // Resolve the outstanding promise and close. Escape/backdrop dismissals settle false.
  const settle = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => settle(false)}
        title={state?.title || ''}
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button variant="secondary" onClick={() => settle(false)}>
              {state?.cancelLabel}
            </Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {state?.confirmLabel}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-[var(--colors-body)]">{state?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
