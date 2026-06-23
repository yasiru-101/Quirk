/**
 * @file SettingsPage.jsx
 * @description Shell page for User Settings and Preferences.
 */
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { normalizeError } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // 'idle' | 'enabling' | 'disabling'
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <header>
        <h1 className="text-[length:var(--typography-heading-1)] tracking-[var(--letter-spacing-heading-1)] font-semibold text-[color:var(--colors-ink)]">
          Settings
        </h1>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-2">
            <button 
              onClick={() => { setActiveTab('profile'); setStep('idle'); }}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => { setActiveTab('notifications'); setStep('idle'); }}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Notifications
            </button>
            <button 
              onClick={() => { setActiveTab('appearance'); setStep('idle'); }}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Appearance
            </button>
            <button 
              onClick={() => { setActiveTab('security'); setStep('idle'); }}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Security
            </button>
          </nav>
        </aside>

        <div className="flex-1 feature-card min-h-[400px]">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-[length:var(--typography-title)] font-medium mb-6">Profile Settings</h2>
              {/* TODO: ProfileForm placeholder */}
              <div className="h-64 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
                ProfileForm Placeholder
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-[length:var(--typography-title)] font-medium mb-6">Notification Preferences</h2>
              {/* TODO: NotificationsForm placeholder */}
              <div className="h-64 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
                NotificationsForm Placeholder
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-[length:var(--typography-title)] font-medium mb-6">Appearance</h2>
              <div className="flex items-center justify-between py-4 border-b border-[var(--colors-hairline)]">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-[color:var(--colors-ink-muted)]">Toggle application color scheme.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="w-12 h-6 rounded-full bg-[var(--colors-surface-pressed)] relative transition-colors focus-ring"
                  aria-pressed={theme === 'dark'}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[var(--colors-ink)] transition-transform ${theme === 'dark' ? 'translate-x-6 bg-[var(--colors-primary)]' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-[length:var(--typography-title)] font-medium mb-6">Security</h2>
              
              <div className="py-4 border-b border-[var(--colors-hairline)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      Two-Factor Authentication (2FA)
                      {user?.twoFactorEnabled ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Enabled</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-medium">Disabled</span>
                      )}
                    </h3>
                    <p className="text-sm text-[color:var(--colors-ink-muted)] mt-1">
                      Protect your account with an extra layer of security.
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
                  <div className="bg-[var(--colors-surface-pressed)] p-4 rounded-lg mt-4 animate-in">
                    <p className="text-sm mb-4">Enter the 6-digit code sent to your email to verify and enable 2FA.</p>
                    <div className="flex items-end gap-4 max-w-sm">
                      <div className="flex-1">
                        <Input
                          id="2fa-code"
                          label="Verification Code"
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                      <Button variant="primary" onClick={handleConfirm2FA} loading={loading} disabled={code.length !== 6}>
                        Verify & Enable
                      </Button>
                    </div>
                    <button type="button" onClick={() => setStep('idle')} className="text-sm text-[var(--colors-primary)] mt-4 hover:underline">
                      Cancel
                    </button>
                  </div>
                )}

                {step === 'disabling' && (
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg mt-4 animate-in">
                    <p className="text-sm text-red-800 dark:text-red-200 mb-4">To disable 2FA, please enter your current password.</p>
                    <div className="flex items-end gap-4 max-w-sm">
                      <div className="flex-1">
                        <Input
                          id="disable-2fa-password"
                          label="Current Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <Button variant="danger" onClick={handleDisable2FA} loading={loading} disabled={!password}>
                        Confirm Disable
                      </Button>
                    </div>
                    <button type="button" onClick={() => setStep('idle')} className="text-sm text-red-600 dark:text-red-400 mt-4 hover:underline">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
