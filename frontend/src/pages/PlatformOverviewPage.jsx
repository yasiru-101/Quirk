import React, { useEffect, useState } from 'react';
import api, { normalizeError } from '../services/api';
import { useToast } from '../context/ToastContext';

const METRICS = [
  ['totalUsers', 'Total users'],
  ['activeUsers', 'Active users'],
  ['platformAdmins', 'Platform admins'],
  ['workspaces', 'Workspaces'],
  ['projects', 'Projects'],
  ['pendingInvitations', 'Pending invites'],
  ['unverifiedUsers', 'Unverified users'],
  ['recentUsers', 'New users this week'],
  ['recentWorkspaces', 'New workspaces this week'],
];

export default function PlatformOverviewPage() {
  const { error: toastError } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/platform/overview')
      .then(({ data }) => setMetrics(data.metrics || {}))
      .catch((err) => toastError(normalizeError(err).message, 'Platform overview failed'))
      .finally(() => setLoading(false));
  }, [toastError]);

  return (
    <div className="page-shell animate-in space-y-8">
      <header>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Platform</p>
        <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[var(--colors-ink)]">Overview</h1>
        <p className="mt-2 max-w-2xl text-[var(--colors-body)]">
          SaaS-level health signals for user support, tenant growth, and security follow-up.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {METRICS.map(([key, label]) => (
          <div key={key} className="feature-card flex h-32 flex-col justify-between">
            <p className="text-[length:var(--typography-caption)] font-medium uppercase tracking-widest text-[var(--colors-ink-muted)]">{label}</p>
            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-[var(--colors-canvas-soft)]" />
            ) : (
              <p className="text-[length:var(--typography-heading-1)] font-bold leading-none tabular-nums">{metrics?.[key] ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-6">
        <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Support posture</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] p-4">
            <p className="text-sm font-semibold text-[var(--colors-ink)]">Tenant isolation</p>
            <p className="mt-1 text-sm text-[var(--colors-body)]">Workspace data remains scoped unless viewed through platform support tools.</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] p-4">
            <p className="text-sm font-semibold text-[var(--colors-ink)]">User support</p>
            <p className="mt-1 text-sm text-[var(--colors-body)]">Use Users and Workspaces to investigate access, activation, and invitation issues.</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] p-4">
            <p className="text-sm font-semibold text-[var(--colors-ink)]">Audit trail</p>
            <p className="mt-1 text-sm text-[var(--colors-body)]">Review recent user, workspace, invitation, and task activity from one support feed.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
