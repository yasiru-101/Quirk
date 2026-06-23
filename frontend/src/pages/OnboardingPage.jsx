/**
 * @file OnboardingPage.jsx
 * @description First-time workspace setup walkthrough.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import BrandLogo from '../components/common/BrandLogo';

const STEPS = [
  {
    title: 'Welcome to Quirk',
    copy: 'Set up a calm workspace for projects, tasks, comments, and workflow columns.',
  },
  {
    title: 'Name your workspace',
    copy: 'Use the organization or team name people already recognize.',
  },
  {
    title: 'Choose a workflow',
    copy: 'Start with a simple Kanban workflow. You can adjust columns inside each project.',
  },
  {
    title: 'Ready to work',
    copy: 'Your workspace is ready. Head to the dashboard and start from the project board.',
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const navigate = useNavigate();
  const totalSteps = STEPS.length;
  const step = STEPS[currentStep - 1];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[var(--colors-canvas)] p-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-[32px] border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] shadow-[var(--shadow-card)]">
        <aside className="hidden w-[42%] flex-col justify-between dark-product-card rounded-none border-0 p-8 lg:flex">
          <BrandLogo variant="light" size="lg" />
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Setup</p>
            <h1 className="text-[length:var(--typography-heading-1)] font-normal text-white">Build your workspace foundation.</h1>
            <p className="mt-4 text-white/62">Quirk keeps status, ownership, and discussion in one place so teams can move without noisy process.</p>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/55">Current step</p>
            <p className="mt-2 text-2xl font-semibold text-white">{currentStep} of {totalSteps}</p>
          </div>
        </aside>

        <main className="flex flex-1 flex-col p-6 md:p-10">
          <div className="mb-10 flex items-center justify-between">
            <BrandLogo className="lg:hidden" size="md" />
            <div className="ml-auto flex items-center gap-2">
              {STEPS.map((item, index) => (
                <div
                  key={item.title}
                  className={`h-2 rounded-full transition-all ${index + 1 <= currentStep ? 'w-9 bg-[var(--colors-primary)]' : 'w-2 bg-[var(--colors-surface-pressed)]'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <section className="w-full max-w-xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Step {currentStep}</p>
              <h2 className="text-[length:var(--typography-heading-1)] font-normal text-[var(--colors-ink)]">{step.title}</h2>
              <p className="mt-3 text-[var(--colors-body)]">{step.copy}</p>

              <div className="mt-8">
                {currentStep === 1 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['Projects', 'Tasks', 'Comments'].map((label) => (
                      <div key={label} className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-4">
                        <p className="font-semibold text-[var(--colors-ink)]">{label}</p>
                        <p className="mt-2 text-sm text-[var(--colors-body)]">Organized from day one.</p>
                      </div>
                    ))}
                  </div>
                )}

                {currentStep === 2 && (
                  <Input
                    label="Workspace name"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    placeholder="Acme product team"
                    hint="You can update this later from settings."
                  />
                )}

                {currentStep === 3 && (
                  <div className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-5">
                    <div className="grid gap-3 sm:grid-cols-4">
                      {['Backlog', 'To Do', 'In Progress', 'Done'].map((column) => (
                        <div key={column} className="rounded-[var(--radius-lg)] bg-[var(--colors-canvas)] p-3 text-sm font-semibold text-[var(--colors-ink)] shadow-[var(--shadow-soft)]">
                          {column}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-6">
                    <p className="text-sm font-semibold text-[var(--colors-ink)]">Workspace</p>
                    <p className="mt-2 text-2xl font-normal text-[var(--colors-ink)]">{workspaceName || 'Quirk workspace'}</p>
                    <p className="mt-3 text-sm text-[var(--colors-body)]">Your first project can now define columns, tasks, and assignments.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-[var(--colors-hairline)] pt-6">
            <Button variant="secondary" onClick={prevStep} disabled={currentStep === 1}>
              Back
            </Button>
            {currentStep < totalSteps ? (
              <Button variant="primary" onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
