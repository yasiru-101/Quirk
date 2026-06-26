import React, { useEffect, useState } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import api, { normalizeError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { getInitials, getRoleBadgeStyle } from '../utils/helpers';

const EMPTY_FORM = { name: '', email: '', isPlatformAdmin: false };

export default function PlatformUsersPage() {
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const { data } = await api.get('/users', { params });
      setUsers(data.users || []);
    } catch (err) {
      toastError(normalizeError(err).message, 'Could not load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/users', form);
      await fetchUsers();
      closeModal();
      success(data.tempPassword ? `User created. Temporary password: ${data.tempPassword}` : 'User created');
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message, 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user, updates) => {
    try {
      await api.put(`/users/${user.id}`, updates);
      await fetchUsers();
      success('User updated');
    } catch (err) {
      toastError(normalizeError(err).message, 'Update failed');
    }
  };

  const deactivateUser = async (user) => {
    const ok = await confirm({
      title: 'Deactivate user',
      message: `Deactivate ${user.name}? They will no longer be able to sign in.`,
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/users/${user.id}/deactivate`);
      await fetchUsers();
      success('User deactivated');
    } catch (err) {
      toastError(normalizeError(err).message, 'Deactivate failed');
    }
  };

  return (
    <div className="page-shell animate-in space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Platform</p>
          <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[color:var(--colors-ink)]">Users</h1>
          <p className="mt-2 max-w-2xl text-[var(--colors-body)]">
            Manage tenant users and platform administrator access across Quirk.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>New user</Button>
      </div>

      <form
        className="flex max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          fetchUsers();
        }}
      >
        <Input
          label="Search users"
          name="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
        />
        <Button type="submit" variant="secondary" className="mt-7 h-11">Search</Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--colors-surface-pressed)]" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Create a user or adjust the search term." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--colors-hairline)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)]">
                {['User', 'Platform admin', 'Status', ''].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-[length:var(--typography-body-sm)] font-semibold uppercase tracking-wider text-[var(--colors-ink-muted)]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--colors-hairline)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--colors-canvas-soft)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--colors-surface-dark)] text-xs font-bold text-white">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--colors-ink)]">{user.name}</p>
                        <p className="text-sm text-[var(--colors-body)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--colors-ink)]">
                      <input
                        type="checkbox"
                        checked={Boolean(user.isPlatformAdmin)}
                        onChange={(event) => updateUser(user, { isPlatformAdmin: event.target.checked })}
                      />
                      Enabled
                    </label>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${user.isActive ? getRoleBadgeStyle('Collaborator') : 'text-zinc-400 bg-zinc-400/10 ring-zinc-400/20'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {user.isActive && (
                      <Button variant="danger" size="sm" onClick={() => deactivateUser(user)}>Deactivate</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="New platform user"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={createUser}>Create user</Button>
          </div>
        }
      >
        <form onSubmit={createUser} className="space-y-5" noValidate>
          <Input label="Name" name="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} error={errors.name} />
          <Input label="Email" name="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} error={errors.email} />
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--colors-ink)]">
            <input
              type="checkbox"
              checked={form.isPlatformAdmin}
              onChange={(event) => setForm((current) => ({ ...current, isPlatformAdmin: event.target.checked }))}
            />
            Grant platform administrator access
          </label>
        </form>
      </Modal>
    </div>
  );
}
