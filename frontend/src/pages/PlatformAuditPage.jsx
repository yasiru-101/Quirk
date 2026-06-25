import React, { useEffect, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import api, { normalizeError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../utils/helpers';

export default function PlatformAuditPage() {
  const { error: toastError } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/platform/audit')
      .then(({ data }) => setEvents(data.events || []))
      .catch((err) => toastError(normalizeError(err).message, 'Could not load audit events'))
      .finally(() => setLoading(false));
  }, [toastError]);

  return (
    <div className="page-shell animate-in space-y-8">
      <header>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Platform</p>
        <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[var(--colors-ink)]">Audit</h1>
        <p className="mt-2 max-w-2xl text-[var(--colors-body)]">
          Recent support-relevant changes across users, tenants, invitations, and task activity.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--colors-surface-pressed)]" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState title="No audit events yet" description="Recent platform activity will appear here." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--colors-hairline)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)]">
                {['Event', 'Context', 'Actor', 'When'].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-[length:var(--typography-body-sm)] font-semibold uppercase tracking-wider text-[var(--colors-ink-muted)]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--colors-hairline)]">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-[var(--colors-canvas-soft)]">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--colors-ink)]">{event.title}</p>
                    <p className="text-xs text-[var(--colors-ink-muted)]">{event.type}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--colors-body)]">{event.detail}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--colors-ink)]">{event.actor}</td>
                  <td className="px-5 py-4 text-sm text-[var(--colors-body)]">{formatRelativeTime(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
