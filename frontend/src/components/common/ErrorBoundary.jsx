/**
 * @file ErrorBoundary.jsx
 * @description A global error boundary to catch React rendering errors and prevent white screens.
 */
import React, { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
          <div className="feature-card max-w-md w-full flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="text-[length:var(--typography-heading-3)] font-semibold tracking-[var(--letter-spacing-heading-3)]">
              Something went wrong
            </h2>
            <p className="text-[color:var(--colors-ink-muted)] text-[length:var(--typography-body-sm)]">
              {this.state.error?.message || 'An unexpected error occurred in the application.'}
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
