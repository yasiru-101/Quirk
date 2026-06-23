/**
 * @file AnalyticsPage.jsx
 * @description Shell page for Analytics Dashboard.
 */
import React from 'react';
import { useProject } from '../context/ProjectContext';

export default function AnalyticsPage() {
  const { activeProject } = useProject();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[length:var(--typography-heading-1)] tracking-[var(--letter-spacing-heading-1)] font-semibold text-[color:var(--colors-ink)]">
          {activeProject ? `${activeProject.name} Analytics` : 'Global Analytics'}
        </h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="feature-card">
          <p className="text-[length:var(--typography-caption)] text-[color:var(--colors-ink-muted)] mb-1">Total Tasks</p>
          <p className="text-[length:var(--typography-heading-2)] font-semibold">124</p>
        </div>
        <div className="feature-card">
          <p className="text-[length:var(--typography-caption)] text-[color:var(--colors-ink-muted)] mb-1">Completion Rate</p>
          <p className="text-[length:var(--typography-heading-2)] font-semibold">68%</p>
        </div>
        <div className="feature-card">
          <p className="text-[length:var(--typography-caption)] text-[color:var(--colors-ink-muted)] mb-1">Overdue</p>
          <p className="text-[length:var(--typography-heading-2)] font-semibold text-rose-500">12</p>
        </div>
        <div className="feature-card">
          <p className="text-[length:var(--typography-caption)] text-[color:var(--colors-ink-muted)] mb-1">Avg Time / Task</p>
          <p className="text-[length:var(--typography-heading-2)] font-semibold">4.2h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="feature-card flex flex-col min-h-[300px]">
          <h3 className="text-[length:var(--typography-title)] font-medium mb-4">Workload Distribution</h3>
          {/* <!-- TODO: WorkloadChart --> */}
          <div className="flex-1 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
            WorkloadChart Placeholder
          </div>
        </div>
        <div className="feature-card flex flex-col min-h-[300px]">
          <h3 className="text-[length:var(--typography-title)] font-medium mb-4">Project Progress</h3>
          {/* <!-- TODO: ProgressSection --> */}
          <div className="flex-1 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
            ProgressSection Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
