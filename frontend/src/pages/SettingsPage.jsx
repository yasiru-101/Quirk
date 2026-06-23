/**
 * @file SettingsPage.jsx
 * @description User settings and preferences.
 */
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { normalizeError } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { getInitials } from '../utils/helpers';

const TABS = ['profile', 'notifications', 'appearance', 'security'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

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
        <p className="mt-2 text-[var(--colors-body)]">Manage your profile, notifications, theme, and account security.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="page-band p-2">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setStep('idle'); }}
                className={`rounded-full px-4 py-2 text-left text-sm font-semibold capitalize transition focus-ring ${
                  activeTab === tab
                    ? 'bg-[var(--colors-primary)] text-[var(--colors-on-primary)]'
                    : 'text-[color:var(--colors-ink-muted)] hover:bg-[var(--colors-canvas-soft)] hover:text-[color:var(--colors-ink)]'
                }`}
              >
                {tab}
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
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Display name" value={user?.name || ''} readOnly />
                <Input label="Email address" value={user?.email || ''} readOnly />
              </div>
              <p className="text-sm text-[var(--colors-body)]">
                Profile editing is managed by workspace administrators in this release.
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-[length:var(--typography-title)] font-semibold">Notifications</h2>
              {[
                ['Task assignments', 'Get notified when a task is assigned to you.'],
                ['Comments', 'Get notified when someone comments on your tasks.'],
                ['Workspace updates', 'Receive summaries for project and membership changes.'],
              ].map(([title, copy]) => (
                <div key={title} className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
                  <div>
                    <p className="font-semibold text-[var(--colors-ink)]">{title}</p>
                    <p className="text-sm text-[var(--colors-body)]">{copy}</p>
                  </div>
                  <span className="pill">Email</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-[length:var(--typography-title)] font-semibold">Appearance</h2>
              <div className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-5">
                <div>
                  <h3 className="font-semibold">Dark mode</h3>
                  <p className="text-sm text-[color:var(--colors-ink-muted)]">Toggle the application color scheme.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="relative h-8 w-14 rounded-full bg-[var(--colors-surface-pressed)] transition-colors focus-ring"
                  aria-pressed={theme === 'dark'}
                >
                  <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-[var(--colors-ink)] transition-transform ${theme === 'dark' ? 'translate-x-6 bg-[var(--colors-primary)]' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
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
          )}
        </section>
      </div>
    </div>
  );
}
