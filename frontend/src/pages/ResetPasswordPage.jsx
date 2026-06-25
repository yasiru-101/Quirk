/**
 * @file ResetPasswordPage.jsx
 * @description Force-password-change wizard using solid, non-glassmorphic styling.
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
import BrandLogo from '../components/common/BrandLogo';

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
    <div className="space-y-3 mt-1 p-3 bg-[var(--colors-canvas-softer)] rounded-xl border border-[var(--colors-hairline)]">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-[var(--colors-hairline)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color }}>{label}</span>
      </div>

      <ul className="grid grid-cols-2 gap-1.5">
        {CHECKS.map((c) => {
          const ok = c.test(password);
          return (
            <li key={c.label} className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-[var(--colors-primary)] font-medium' : 'text-[var(--colors-mute)]'}`}>
              <span className="flex-shrink-0">{ok ? '✓' : '○'}</span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
      await authService.resetPassword(form.currentPassword, form.newPassword, form.confirmPassword);
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--colors-canvas-soft)] animate-in">
      
      <div className="w-full max-w-[460px]">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size="lg" className="mb-6" />
          <h1 className="text-[var(--typography-display-sm)] font-bold text-[var(--colors-ink)]">Set your new password</h1>
          <p className="text-[var(--typography-body-md)] text-[var(--colors-body)] mt-2 text-center max-w-sm">
            This is your first login. For your security, please update your password.
          </p>
        </div>

        <div className="card p-8 space-y-6 slide-up">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
              className="w-full h-12 text-base font-semibold mt-4 shadow-sm"
            >
              Update Password
            </Button>
          </form>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="text-[13px] font-medium text-[var(--colors-mute)] hover:text-[var(--colors-ink)] transition-colors"
          >
            Cancel and return to login
          </button>
        </div>
      </div>
    </div>
  );
}
