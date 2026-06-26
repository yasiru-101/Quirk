/**
 * @file TopBar.jsx
 * @description Top navigation bar with breadcrumbs, search, notifications, and quick task creation.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useConfirm } from '../../context/ConfirmContext';
import api from '../../services/api';
import { getInitials } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

const BREADCRUMBS = {
  '/dashboard': ['Workspace', 'Overview'],
  '/tasks': ['Workspace', 'Tasks'],
  '/users': ['Administration', 'Directory'],
  '/projects': ['Workspace', 'Projects'],
  '/analytics': ['Workspace', 'Analytics'],
  '/settings': ['Account', 'Settings'],
  '/chat': ['Workspace', 'Chat'],
};

export default function TopBar({ onOpenMobileNav }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const crumbs = BREADCRUMBS[pathname] ?? ['Quirk', 'Overview'];
  const [panelOpen, setPanelOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, role, isPlatformAdmin } = useAuth();
  const { activeWorkspace, canManageWorkspace } = useProject();
  const confirm = useConfirm();
  const profileRef = useRef(null);

  // Only task creators (platform admins, workspace Owners/Admins, project managers)
  // see the quick "New task" action. Collaborators cannot create tasks.
  const canCreateTasks = isPlatformAdmin || canManageWorkspace || role === ROLES.ADMIN || role === ROLES.PROJECT_MANAGER;

  // Close the profile menu on outside click or Escape so it always minimizes.
  useEffect(() => {
    if (!profileMenuOpen) return;
    const onPointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (e) => e.key === 'Escape' && setProfileMenuOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileMenuOpen]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);


  // Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [searchResults, setSearchResults] = useState({ tasks: [], projects: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Close search results on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  // Search API call
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ tasks: [], projects: [], users: [] });
      return;
    }
    
    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
        .then(({ data }) => setSearchResults(data))
        .catch(err => console.error('Search failed:', err))
        .finally(() => setIsSearching(false));
    }, 300); // debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const hasResults = searchResults.tasks?.length > 0 || searchResults.projects?.length > 0 || searchResults.users?.length > 0;

  // Tasks live inside a project. If a project board is open, ask it to open the
  // create modal; otherwise send the user to projects to pick one.
  const handleNewTask = () => {
    if (pathname.startsWith('/tasks')) {
      window.dispatchEvent(new CustomEvent('task:create'));
      return;
    }
    navigate('/tasks', { state: { createTask: Date.now() } });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[60px] flex-shrink-0 items-center justify-between border-b border-[var(--colors-hairline)] bg-[rgba(255,255,255,0.86)] px-6 backdrop-blur-xl dark:bg-[rgba(10,11,13,0.86)]">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--colors-ink-muted)]">
          <button
            onClick={onOpenMobileNav}
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-ink)] focus-ring lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span>{activeWorkspace?.name || crumbs[0]}</span>
          <span className="text-[color:var(--colors-ink-faint)]">/</span>
          <span className="text-[color:var(--colors-ink)]">{crumbs[1]}</span>
        </div>

        <div className="mx-4 hidden max-w-[360px] flex-1 md:block" ref={searchRef}>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[color:var(--colors-ink-faint)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search tasks, projects, people"
              className="h-10 w-full rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] pl-9 pr-14 text-[13px] text-[var(--colors-ink)] transition placeholder:text-[var(--colors-ink-faint)] focus-ring"
            />
            <span className="absolute inset-y-0 right-2 flex items-center">
              <kbd className="hidden rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[color:var(--colors-ink-muted)] shadow-sm sm:inline-block">
                Ctrl K
              </kbd>
            </span>

            {/* Dropdown Results */}
            {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute left-0 right-0 top-12 max-h-[400px] overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shadow-xl z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-[var(--colors-ink-muted)]">Searching...</div>
                ) : !hasResults ? (
                  <div className="p-4 text-center text-sm text-[var(--colors-ink-muted)]">No results found for "{searchQuery}"</div>
                ) : (
                  <div className="py-2">
                    {/* Tasks */}
                    {searchResults.tasks?.length > 0 && (
                      <div className="mb-2">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--colors-ink-faint)]">Tasks</p>
                        {searchResults.tasks.map((t) => (
                          <button
                            key={t.id}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-[var(--colors-canvas-soft)]"
                            onMouseDown={(e) => { e.preventDefault(); }}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(`/tasks/${t.id}`);
                            }}
                          >
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-600">
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            </span>
                            <span className="truncate font-medium text-[var(--colors-ink)]">{t.title}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {searchResults.projects?.length > 0 && (
                      <div className="mb-2">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--colors-ink-faint)]">Projects</p>
                        {searchResults.projects.map((p) => (
                          <button
                            key={p.id}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-[var(--colors-canvas-soft)]"
                            onMouseDown={(e) => { e.preventDefault(); }}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(`/projects/${p.id}`);
                            }}
                          >
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--colors-surface-dark)] text-[10px] font-bold text-white">
                              {p.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="truncate font-medium text-[var(--colors-ink)]">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users?.length > 0 && (
                      <div className="mb-2">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--colors-ink-faint)]">People</p>
                        {searchResults.users.map((u) => (
                          <button
                            key={u.id}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-[var(--colors-canvas-soft)]"
                            onMouseDown={(e) => { e.preventDefault(); }}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(`/members`);
                            }}
                          >
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                              {u.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="truncate font-medium text-[var(--colors-ink)]">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="border-t border-[var(--colors-hairline)] px-4 py-2">
                  <button
                    className="w-full text-left text-xs text-[var(--colors-ink-muted)] transition hover:text-[var(--colors-primary)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/tasks?search=${encodeURIComponent(searchQuery)}`);
                    }}
                  >
                    Search all tasks for &ldquo;{searchQuery}&rdquo; &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-ink)] focus-ring"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            )}
          </button>

          <NotificationBell onClick={() => setPanelOpen(true)} />

          {canCreateTasks && (
            <button
              onClick={handleNewTask}
              className="hidden h-10 items-center rounded-full bg-[var(--colors-primary)] px-4 text-sm font-semibold text-[var(--colors-on-primary)] transition hover:bg-[var(--colors-primary-hover)] focus-ring sm:flex"
            >
              New task
            </button>
          )}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] text-xs font-bold text-[var(--colors-ink)] focus-ring transition hover:bg-[var(--colors-surface-pressed)]"
            >
              {getInitials(user?.name)}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] py-2 shadow-lg z-50">
                <div className="px-4 py-2 border-b border-[var(--colors-hairline)] mb-1">
                  <p className="truncate text-sm font-semibold text-[var(--colors-ink)]">{user?.name}</p>
                  <p className="truncate text-xs text-[var(--colors-ink-muted)]">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--colors-ink)] hover:bg-[var(--colors-surface-pressed)] transition"
                >
                  Settings
                </button>
                <button
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    const ok = await confirm({
                      title: 'Sign out',
                      message: 'Sign out of Quirk?',
                      confirmLabel: 'Sign out',
                    });
                    if (!ok) return;
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-[var(--colors-priority-urgent)] hover:bg-[var(--colors-priority-urgent)]/10 transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
