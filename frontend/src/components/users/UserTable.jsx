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
      title={isEdit ? 'Edit User' : 'Create User'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-role" className="text-xs font-medium text-zinc-400">Role *</label>
          <select
            id="user-role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-700/50 text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
          >
            {ROLE_LIST.map((r) => <option key={r}>{r}</option>)}
          </select>
          {errors.role && <p className="text-xs text-rose-400">⚠ {errors.role}</p>}
        </div>
        {!isEdit && (
          <p className="text-[11px] text-zinc-600 leading-relaxed bg-zinc-800 rounded-lg px-3 py-2.5">
            📧 A temporary password will be emailed to the user. They will be required to change it on first login.
          </p>
        )}
      </form>
    </Modal>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
/**
 * User grid rendering profiles, active/inactive statuses, role tags, and registration dates.
 * Offers deactivation buttons and opens details popups.
 *
 * @param {string} props.search - Active search phrase
 */
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
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title={search ? 'No users match your search' : 'No users yet'}
        description={search ? 'Try a different name, email, or role.' : 'Create the first user to get started.'}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 tracking-wide uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u._id}
                className="border-b last:border-0 hover:bg-zinc-800/30 transition-colors group"
                style={{ borderColor: 'var(--border-light)' }}
              >
                {/* User */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ring-1',
                      u.isActive
                        ? 'bg-indigo-500/20 text-indigo-400 ring-indigo-500/20'
                        : 'bg-zinc-800 text-zinc-500 ring-zinc-700/50'
                    )}>
                      {getInitials(u.name)}
                    </div>
                    <div>
                      <p className={cn('text-xs font-medium', u.isActive ? 'text-zinc-100' : 'text-zinc-500 line-through')}>
                        {u.name}
                      </p>
                      <p className="text-[11px] text-zinc-600">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-5 py-3.5">
                  <span className={cn('text-[11px] font-medium px-2.5 py-0.5 rounded-full ring-1 ring-inset', getRoleBadgeStyle(u.role))}>
                    {u.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full', u.isActive ? 'bg-emerald-500' : 'bg-zinc-600')} />
                    <span className={cn('text-[11px]', u.isActive ? 'text-emerald-400' : 'text-zinc-500')}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {u.mustResetPassword && u.isActive && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full ring-1 ring-amber-400/20">
                        Pending setup
                      </span>
                    )}
                  </div>
                </td>

                {/* Joined */}
                <td className="px-5 py-3.5 text-xs text-zinc-500">{formatDate(u.createdAt)}</td>

                {/* Actions */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPanel({ open: true, user: u })}
                      className="text-zinc-500 hover:text-zinc-100 p-1.5 rounded hover:bg-zinc-700 transition-colors focus-ring"
                      aria-label={`Edit ${u.name}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {u.isActive && (
                      <button
                        onClick={() => handleDeactivate(u._id)}
                        className="text-zinc-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-400/10 transition-colors focus-ring"
                        aria-label={`Deactivate ${u.name}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// Export the create modal so UserManagementPage can invoke it too
export { UserFormModal };
