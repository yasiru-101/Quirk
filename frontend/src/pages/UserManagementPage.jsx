/**
 * @file UserManagementPage.jsx
 * @description Admin control board managing users, roles, and profiles.
 */
import React, { useState } from 'react';
import UserTable, { UserFormModal } from '../components/users/UserTable';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="page-shell animate-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--colors-hairline)] pb-6">
        <div>
          <h1 className="text-[var(--typography-display-sm)] font-bold text-[var(--colors-ink)]">Directory</h1>
          <p className="text-[var(--typography-body-md)] text-[var(--colors-body)] mt-1.5">
            Manage your team members and their account permissions.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto h-11">
          + Invite User
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="w-full sm:w-80">
          <Input
            id="user-search"
            type="search"
            placeholder="Search by name, email, or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <UserTable search={search} />
      </div>

      <UserFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        user={null}
        onSaved={() => {}}
      />
    </div>
  );
}
