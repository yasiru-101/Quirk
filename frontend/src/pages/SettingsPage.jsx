/**
 * @file SettingsPage.jsx
 * @description Shell page for User Settings and Preferences.
 */
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, toggleTheme } = useTheme();

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
              onClick={() => setActiveTab('profile')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Notifications
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink)]' : 'text-[color:var(--colors-ink-muted)] hover:text-[color:var(--colors-ink)]'}`}
            >
              Appearance
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
        </div>
      </div>
    </div>
  );
}
