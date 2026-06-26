/**
 * @file SettingsPage.jsx
 * @description User settings and preferences.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { normalizeError } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { getInitials } from '../utils/helpers';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Notifications & Security' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  // Profile — display name editing
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const trimmedName = name.trim();
  const nameDirty = trimmedName !== (user?.name || '') && trimmedName.length >= 2;

  // Profile — change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const pwReady = pw.current && pw.next && pw.confirm;

  // Notification preferences state (UI only for now)
  const [notifyPrefs, setNotifyPrefs] = useState({
    assignments: true,
    comments: true,
    updates: true,
  });

  const toggleNotifyPref = (key) => {
    setNotifyPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    toastSuccess('Notification preferences updated');
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      const { data } = await authService.updateProfile(trimmedName);
      updateUser({ name: data.user.name });
      setName(data.user.name);
      toastSuccess('Display name updated.');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (pw.next !== pw.confirm) {
      toastError("New password and confirmation don't match.", 'Password mismatch');
      return;
    }
    setSavingPw(true);
    try {
      await authService.resetPassword(pw.current, pw.next, pw.confirm);
      setPw({ current: '', next: '', confirm: '' });
      setShowPasswordForm(false);
      toastSuccess('Password changed successfully.');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      await authService.enable2fa();
      setStep('enabling');
      toastSuccess('Verification code sent to your email.');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Failed to start 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setLoading(true);
    try {
      await authService.confirm2fa(code);
      updateUser({ twoFactorEnabled: true });
      setStep('idle');
      setCode('');
      toastSuccess('Two-factor authentication enabled.');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      await authService.disable2fa(password);
      updateUser({ twoFactorEnabled: false });
      setStep('idle');
      setPassword('');
      toastSuccess('Two-factor authentication disabled.');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell animate-in space-y-8">
      <header>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Account</p>
        <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[color:var(--colors-ink)]">
          Settings
        </h1>
        <p className="mt-2 text-[var(--colors-body)]">Manage your profile, notifications, and account security.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="page-band p-2">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStep('idle'); }}
                className={`rounded-full px-4 py-2 text-left text-sm font-semibold transition focus-ring ${
                  activeTab === tab.id
                    ? 'bg-[var(--colors-primary)] text-[var(--colors-on-primary)]'
                    : 'text-[color:var(--colors-ink-muted)] hover:bg-[var(--colors-canvas-soft)] hover:text-[color:var(--colors-ink)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="feature-card min-h-[420px]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-[length:var(--typography-title)] font-semibold">Profile</h2>
              <div className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--colors-surface-dark)] text-lg font-bold text-white">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-semibold text-[var(--colors-ink)]">{user?.name || 'Quirk user'}</p>
                  <p className="text-sm text-[var(--colors-body)]">{user?.email}</p>
                </div>
                <span className="pill">{user?.role || 'Member'}</span>
              </div>

              {/* Display name — self-service edit */}
              <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder="Your name"
                  />
                  <Input label="Email address" value={user?.email || ''} readOnly />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="primary" onClick={handleSaveName} loading={savingName} disabled={!nameDirty}>
                    Save name
                  </Button>
                  {nameDirty && (
                    <button
                      type="button"
                      onClick={() => setName(user?.name || '')}
                      className="text-sm font-semibold text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)]"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-xs text-[var(--colors-ink-muted)]">
                  Your email address is managed by workspace administrators.
                </p>
              </div>

              {/* Change password */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Password</h3>
                    <p className="mt-1 text-sm text-[color:var(--colors-ink-muted)]">
                      Change the password you use to sign in.
                    </p>
                  </div>
                  {!showPasswordForm && (
                    <Button variant="secondary" onClick={() => setShowPasswordForm(true)}>
                      Change password
                    </Button>
                  )}
                </div>

                {showPasswordForm && (
                  <div className="mt-5 space-y-4 animate-in">
                    <div className="grid max-w-xl gap-4">
                      <Input
                        id="current-password"
                        label="Current password"
                        type="password"
                        value={pw.current}
                        onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                        placeholder="Current password"
                      />
                      <Input
                        id="new-password"
                        label="New password"
                        type="password"
                        value={pw.next}
                        onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                        placeholder="At least 8 characters"
                      />
                      <Input
                        id="confirm-password"
                        label="Confirm new password"
                        type="password"
                        value={pw.confirm}
                        onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Re-enter new password"
                      />
                    </div>
                    <p className="text-xs text-[var(--colors-ink-muted)]">
                      Use at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button variant="primary" onClick={handleChangePassword} loading={savingPw} disabled={!pwReady}>
                        Update password
                      </Button>
                      <button
                        type="button"
                        onClick={() => { setShowPasswordForm(false); setPw({ current: '', next: '', confirm: '' }); }}
                        className="text-sm font-semibold text-[var(--colors-ink-muted)] hover:text-[var(--colors-ink)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-10">
              {/* Notifications */}
              <div className="space-y-6">
                <h2 className="text-[length:var(--typography-title)] font-semibold">Notifications</h2>
                {[
                  { title: 'Task assignments', key: 'assignments', copy: 'Get notified when a task is assigned to you.' },
                  { title: 'Comments', key: 'comments', copy: 'Get notified when someone comments on your tasks.' },
                  { title: 'Workspace updates', key: 'updates', copy: 'Receive summaries for project and membership changes.' },
                ].map(({ title, key, copy }) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
                    <div>
                      <p className="font-semibold text-[var(--colors-ink)]">{title}</p>
                      <p className="text-sm text-[var(--colors-body)]">{copy}</p>
                    </div>
                    <button
                      onClick={() => toggleNotifyPref(key)}
                      className="relative h-8 w-14 rounded-full bg-[var(--colors-surface-pressed)] transition-colors focus-ring"
                      aria-pressed={notifyPrefs[key]}
                    >
                      <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-[var(--colors-ink)] transition-transform ${notifyPrefs[key] ? 'translate-x-6 bg-[var(--colors-primary)]' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Security */}
              <div className="space-y-6">
                <h2 className="text-[length:var(--typography-title)] font-semibold">Security</h2>
                <div className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="flex flex-wrap items-center gap-2 font-semibold">
                        Two-factor authentication
                        {user?.twoFactorEnabled ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Enabled</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">Disabled</span>
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-[color:var(--colors-ink-muted)]">
                        Protect your account with an email verification code during sign in.
                      </p>
                    </div>

                    {step === 'idle' && !user?.twoFactorEnabled && (
                      <Button variant="primary" onClick={handleEnable2FA} loading={loading}>
                        Enable 2FA
                      </Button>
                    )}
                    {step === 'idle' && user?.twoFactorEnabled && (
                      <Button variant="danger" onClick={() => setStep('disabling')}>
                        Disable 2FA
                      </Button>
                    )}
                  </div>

                  {step === 'enabling' && (
                    <div className="mt-5 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] p-4 animate-in">
                      <p className="mb-4 text-sm text-[var(--colors-body)]">Enter the 6-digit code sent to your email.</p>
                      <div className="flex max-w-md flex-col gap-4 sm:flex-row sm:items-end">
                        <Input
                          id="2fa-code"
                          label="Verification code"
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                        />
                        <Button variant="primary" onClick={handleConfirm2FA} loading={loading} disabled={code.length !== 6}>
                          Verify
                        </Button>
                      </div>
                      <button type="button" onClick={() => setStep('idle')} className="mt-4 text-sm font-semibold text-[var(--colors-primary-active)] hover:underline">
                        Cancel
                      </button>
                    </div>
                  )}

                  {step === 'disabling' && (
                    <div className="mt-5 rounded-[var(--radius-xl)] border border-red-100 bg-red-50 p-4 animate-in dark:border-red-900/40 dark:bg-red-950/20">
                      <p className="mb-4 text-sm text-red-800 dark:text-red-200">Enter your current password to disable 2FA.</p>
                      <div className="flex max-w-md flex-col gap-4 sm:flex-row sm:items-end">
                        <Input
                          id="disable-2fa-password"
                          label="Current password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Current password"
                        />
                        <Button variant="danger" onClick={handleDisable2FA} loading={loading} disabled={!password}>
                          Confirm
                        </Button>
                      </div>
                      <button type="button" onClick={() => setStep('idle')} className="mt-4 text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
