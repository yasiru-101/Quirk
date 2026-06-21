/**
 * @file ResetPasswordPage.jsx
 * @description Force-password-change wizard.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { normalizeError } from '../services/api';
import { validatePassword } from '../utils/helpers';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

// ── Password strength meter ───────────────────────────────────────────────────
const CHECKS = [
  { label: 'At least 8 characters',   test: (p) => p.length >= 8 },
  { label: 'Uppercase letter',         test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',         test: (p) => /[a-z]/.test(p) },
  { label: 'Number',                   test: (p) => /\d/.test(p) },
  { label: 'Special character (!@#$%^&*)', test: (p) => /[!@#$%^&*]/.test(p) },
];

function StrengthMeter({ password }) {
  const passed = CHECKS.filter((c) => c.test(password)).length;
  const pct = (passed / CHECKS.length) * 100;

  const color =
    passed <= 1 ? '#ef4444' :
    passed <= 2 ? '#f59e0b' :
    passed <= 3 ? '#eab308' :
    passed <= 4 ? '#22c55e' :
    '#10b981';

  const label =
    passed <= 1 ? 'Very weak' :
    passed <= 2 ? 'Weak' :
    passed <= 3 ? 'Fair' :
    passed <= 4 ? 'Good' :
    'Strong';

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {CHECKS.map((c) => {
          const ok = c.test(password);
          return (
            <li key={c.label} className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <span className="flex-shrink-0">{ok ? '✓' : '○'}</span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Renders forms guiding password updates, policing password formatting rules, 
 * and completing mock onboarding flags.
 */
export default function ResetPasswordPage() {
  const { updateUser, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Current password is required';
    const policyErrors = validatePassword(form.newPassword);
    if (policyErrors.length > 0) errs.newPassword = policyErrors[0];
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.resetPassword(form.currentPassword, form.newPassword);
      updateUser({ mustResetPassword: false });
      toastSuccess('Password updated successfully. Welcome aboard!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 flex items-center justify-center mb-4 text-amber-400 text-xl">
            🔐
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Set your new password</h1>
          <p className="text-xs text-zinc-500 mt-1.5 text-center max-w-xs leading-relaxed">
            This is your first login. You must set a new password before accessing the system.
          </p>
        </div>

        <div className="card p-6 space-y-5" style={{ background: 'var(--bg-surface)' }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="reset-current"
              label="Temporary password"
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              placeholder="From your welcome email"
              autoComplete="current-password"
            />

            <div className="space-y-2">
              <Input
                id="reset-new"
                label="New password"
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                placeholder="Choose a strong password"
                autoComplete="new-password"
              />
              {form.newPassword.length > 0 && (
                <StrengthMeter password={form.newPassword} />
              )}
            </div>

            <Input
              id="reset-confirm"
              label="Confirm new password"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full h-10 mt-2"
            >
              Set password &amp; continue
            </Button>
          </form>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Sign out and return to login
          </button>
        </div>
      </div>
    </div>
  );
}
