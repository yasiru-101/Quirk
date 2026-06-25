import React, { useEffect, useState } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import api, { normalizeError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate, getInitials } from '../utils/helpers';

export default function PlatformWorkspacesPage() {
  const { error: toastError } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const { data } = await api.get('/platform/workspaces', { params });
      setWorkspaces(data.workspaces || []);
    } catch (err) {
      toastError(normalizeError(err).message, 'Could not load workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-shell animate-in space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Platform</p>
          <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[var(--colors-ink)]">Workspaces</h1>
          <p className="mt-2 max-w-2xl text-[var(--colors-body)]">Tenant support view for workspace membership and project footprint.</p>
        </div>
      </header>

      <form
        className="flex max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          fetchWorkspaces();
        }}
      >
        <Input label="Search workspaces" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Workspace name" />
        <Button type="submit" variant="secondary" className="mt-7 h-11">Search</Button>
      </form>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-[var(--radius-xl)] bg-[var(--colors-surface-pressed)]" />)}
        </div>
      ) : workspaces.length === 0 ? (
        <EmptyState title="No workspaces found" description="Adjust the search term or check whether tenants have been created." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <article key={workspace.id} className="feature-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">{workspace.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--colors-body)]">{workspace.description || 'No description provided.'}</p>
                </div>
                <span className="pill">{formatDate(workspace.createdAt)}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-[var(--radius-lg)] bg-[var(--colors-canvas-soft)] p-3">
                  <p className="text-xs text-[var(--colors-ink-muted)]">Members</p>
                  <p className="mt-1 text-xl font-bold">{workspace.memberCount}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] bg-[var(--colors-canvas-soft)] p-3">
                  <p className="text-xs text-[var(--colors-ink-muted)]">Projects</p>
                  <p className="mt-1 text-xl font-bold">{workspace.projectCount}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] bg-[var(--colors-canvas-soft)] p-3">
                  <p className="text-xs text-[var(--colors-ink-muted)]">Invites</p>
                  <p className="mt-1 text-xl font-bold">{workspace.invitationCount}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-[var(--colors-hairline)] pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--colors-ink-muted)]">Admins</p>
                <div className="flex flex-wrap gap-2">
                  {(workspace.adminMembers || []).map((member) => (
                    <span key={member.userId} className="inline-flex items-center gap-2 rounded-full border border-[var(--colors-hairline)] px-3 py-1.5 text-xs font-semibold">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--colors-surface-dark)] text-[9px] text-white">{getInitials(member.user?.name)}</span>
                      {member.user?.name || member.user?.email}
                    </span>
                  ))}
                  {!workspace.adminMembers?.length && <span className="text-sm text-[var(--colors-priority-urgent)]">No admin found</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
