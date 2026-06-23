/**
 * @file NotFoundPage.jsx
 * @description Resource Not Found (HTTP 404) fallback screen.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--colors-canvas-soft)] p-6">
      <div className="text-center space-y-6 max-w-md animate-in slide-up card p-10">
        <div className="text-7xl mb-4">🌌</div>
        <h1 className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] tracking-tight">Page Not Found</h1>
        <p className="text-[var(--typography-body-lg)] text-[var(--colors-body)]">
          The page you're looking for doesn't exist or has been moved to another universe.
        </p>
        <div className="flex justify-center pt-4">
          <Link to="/dashboard">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">Return to Dashboard</Button>
          </Link>
        </div>
        <p className="text-[11px] font-mono text-[var(--colors-mute)] pt-6 uppercase tracking-widest">HTTP 404 Not Found</p>
      </div>
    </div>
  );
}
