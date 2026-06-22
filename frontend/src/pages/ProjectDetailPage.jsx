/**
 * @file ProjectDetailPage.jsx
 * @description Shell page for a Project scoped board view.
 */
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { setActiveProject } = useProject();
  const { role } = useAuth();
  const isPM = role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN;

  useEffect(() => {
    // Shell implementation - would normally fetch by id
    setActiveProject({ id, name: 'Sample Project', columns: [] });
    return () => setActiveProject(null);
  }, [id, setActiveProject]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-[length:var(--typography-heading-2)] tracking-[var(--letter-spacing-heading-2)] font-semibold text-[color:var(--colors-ink)]">
            Project Board
          </h1>
          <div className="flex -space-x-2">
            {/* TODO: Member Avatars */}
            <div className="w-8 h-8 rounded-full bg-[var(--colors-canvas-soft)] border-2 border-[var(--colors-canvas)] z-10"></div>
            <div className="w-8 h-8 rounded-full bg-[var(--colors-canvas-soft)] border-2 border-[var(--colors-canvas)] z-0"></div>
          </div>
        </div>
        
        {isPM && (
          <Button variant="secondary">
            Manage Columns
          </Button>
        )}
      </header>

      <div className="flex-1 min-h-0 relative">
        {/* TODO: [teammate-feature] KanbanBoard placeholder */}
        <div className="absolute inset-0 feature-card border-dashed flex flex-col items-center justify-center text-[color:var(--colors-ink-faint)]">
          Kanban Board Component Placeholder
        </div>
      </div>
    </div>
  );
}
