/**
 * @file UserTable.jsx
 * @description Admin control board managing users, roles, statuses, and profiles.
 */
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { getRoleBadgeStyle, getInitials, formatDate, cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { MailIcon, UsersIcon } from '../common/Icons';
import { normalizeError } from '../../services/api';

const ROLE_LIST = [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.COLLABORATOR];

const EMPTY_FORM = { name: '', email: '', role: ROLES.COLLABORATOR };

// ── Create / Edit Panel ───────────────────────────────────────────────────────
function UserFormModal({ open, onClose, user = null, onSaved }) {
  const { success, error: toastError } = useToast();
  const isEdit = !!user;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(user ? { name: user.name, email: user.email, role: user.role } : EMPTY_FORM);
      setErrors({});
    }
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.role) errs.role = 'Role is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      let saved;
      if (isEdit) {
        const { data } = await userService.updateUser(user._id, form);
        saved = data.user;
        success('User updated successfully');
      } else {
        const { data } = await userService.createUser(form);
        saved = data.user;
        success('User created. Onboarding email sent.');
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Invite User'}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Send invitation'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          id="user-name"
          label="Full name *"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g. Sarah Johnson"
          autoComplete="name"
        />
        <Input
          id="user-email"
          label="Email address *"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="user@company.com"
          disabled={isEdit}
          hint={isEdit ? 'Email cannot be changed after creation' : undefined}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="user-role" className="text-sm font-semibold text-[var(--colors-ink)]">Role *</label>
          <div className="relative">
            <select
              id="user-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-[var(--radius-md)] bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] text-sm text-[var(--colors-ink)] outline-none focus-ring appearance-none transition-all shadow-sm"
            >
              {ROLE_LIST.map((r) => <option key={r}>{r}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--colors-mute)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
          {errors.role && <p className="text-xs text-[var(--colors-priority-urgent)] mt-1 font-medium">⚠ {errors.role}</p>}
        </div>
         {!isEdit && (
          <div className="flex items-start gap-3 bg-[var(--colors-canvas-softer)] border border-[var(--colors-hairline)] rounded-lg p-4 mt-2">
            <MailIcon className="w-5 h-5 text-[var(--colors-primary)] mt-0.5" />
            <p className="text-xs text-[var(--colors-body)] leading-relaxed font-medium">
              A temporary password will be emailed to the user. They will be required to change it on their first login.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function UserTable({ search }) {
  const { success, error: toastError, warning } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState({ open: false, user: null });

  useEffect(() => {
    setLoading(true);
    userService
      .getUsers()
      .then(({ data }) => setUsers(data.users ?? []))
      .catch(() => toastError('Failed to load users. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeactivate = async (userId) => {
    const u = users.find((x) => x._id === userId);
    if (!window.confirm(`Deactivate ${u?.name}? They will lose all system access.`)) return;
    setUsers((prev) => prev.map((x) => (x._id === userId ? { ...x, isActive: false } : x)));
    try {
      await userService.deactivateUser(userId);
      warning(`${u?.name} has been deactivated.`);
    } catch {
      toastError('Failed to deactivate user.');
    }
  };

  const handleSaved = (saved) => {
    setUsers((prev) => {
      const exists = prev.some((x) => x._id === saved._id);
      return exists
        ? prev.map((x) => (x._id === saved._id ? { ...x, ...saved } : x))
        : [{ ...saved, isActive: true, mustResetPassword: true, createdAt: new Date().toISOString() }, ...prev];
    });
  };

  // Apply search
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    );
  }

   if (filtered.length === 0) {
    return (
      <div className="py-10">
        <EmptyState
          icon={<UsersIcon className="w-6 h-6 text-[var(--colors-mute)]" />}
          title={search ? 'No users match your search' : 'No users yet'}
          description={search ? 'Try a different name, email, or role.' : 'Invite your first team member.'}
        />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-softer)]">
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs font-bold text-[var(--colors-body)] tracking-wider uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
            {filtered.map((u) => (
              <tr
                key={u._id}
                className="hover:bg-[var(--colors-canvas-soft)] transition-colors group"
              >
                {/* User */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2',
                      u.isActive
                        ? 'bg-[var(--colors-primary)] text-black ring-[var(--colors-primary-glow)]'
                        : 'bg-[var(--colors-canvas-softer)] text-[var(--colors-mute)] ring-[var(--colors-hairline)]'
                    )}>
                      {getInitials(u.name)}
                    </div>
                    <div>
                      <p className={cn('text-sm font-semibold', u.isActive ? 'text-[var(--colors-ink)]' : 'text-[var(--colors-mute)] line-through')}>
                        {u.name}
                      </p>
                      <p className="text-xs text-[var(--colors-body)] font-medium mt-0.5">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4">
                  <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', getRoleBadgeStyle(u.role))}>
                    {u.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-2 h-2 rounded-full shadow-sm', u.isActive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-[var(--colors-mute)]')} />
                    <span className={cn('text-xs font-bold', u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--colors-mute)]')}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {u.mustResetPassword && u.isActive && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                </td>

                {/* Joined */}
                <td className="px-6 py-4 text-xs font-medium text-[var(--colors-body)]">{formatDate(u.createdAt)}</td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPanel({ open: true, user: u })}
                      className="text-[var(--colors-mute)] hover:text-[var(--colors-ink)] p-2 rounded-lg hover:bg-[var(--colors-canvas-softer)] transition-colors focus-ring"
                      aria-label={`Edit ${u.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {u.isActive && (
                      <button
                        onClick={() => handleDeactivate(u._id)}
                        className="text-[var(--colors-mute)] hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors focus-ring"
                        aria-label={`Deactivate ${u.name}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormModal
        open={panel.open}
        onClose={() => setPanel({ open: false, user: null })}
        user={panel.user}
        onSaved={handleSaved}
      />
    </>
  );
}

export { UserFormModal };
