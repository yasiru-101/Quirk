/**
 * @file ProjectsPage.jsx
 * @description Shell page for Projects feature.
 */
import React from 'react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function ProjectsPage() {
  const { role } = useAuth();
  const canCreate = role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[length:var(--typography-heading-1)] tracking-[var(--letter-spacing-heading-1)] font-semibold text-[color:var(--colors-ink)]">
          Projects
        </h1>
        {canCreate && (
          <Button variant="primary">
            + New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* TODO: [teammate-feature] ProjectsGrid placeholder */}
        <div className="feature-card h-48 border-dashed flex flex-col items-center justify-center text-[color:var(--colors-ink-faint)]">
          Project Card Placeholder
        </div>
        <div className="feature-card h-48 border-dashed flex flex-col items-center justify-center text-[color:var(--colors-ink-faint)]">
          Project Card Placeholder
        </div>
        <div className="feature-card h-48 border-dashed flex flex-col items-center justify-center text-[color:var(--colors-ink-faint)]">
          Project Card Placeholder
        </div>
      </div>
    </div>
  );
}
