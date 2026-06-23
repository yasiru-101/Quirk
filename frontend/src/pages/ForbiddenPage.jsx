/**
 * @file ForbiddenPage.jsx
 * @description Access Denied (HTTP 403) page.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--colors-canvas-soft)] p-6">
      <div className="text-center space-y-6 max-w-md animate-in slide-up card p-10">
        <div className="text-7xl mb-4">🛡️</div>
        <h1 className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] tracking-tight">Access Denied</h1>
        <p className="text-[var(--typography-body-lg)] text-[var(--colors-body)]">
          You don't have permission to view this page. Contact your administrator if you believe this is a mistake.
        </p>
        <div className="flex justify-center pt-4">
          <Link to="/dashboard">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">Return to Dashboard</Button>
          </Link>
        </div>
        <p className="text-[11px] font-mono text-[var(--colors-mute)] pt-6 uppercase tracking-widest">HTTP 403 Forbidden</p>
      </div>
    </div>
  );
}
