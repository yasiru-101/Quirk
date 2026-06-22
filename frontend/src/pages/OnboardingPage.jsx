/**
 * @file OnboardingPage.jsx
 * @description Shell page for the first-time login Onboarding Wizard.
 */
import React, { useState } from 'react';
import Button from '../components/common/Button';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      <div className="feature-card-elevated w-full max-w-3xl min-h-[500px] flex flex-col relative overflow-hidden">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step ? 'bg-[var(--colors-primary)] text-[var(--colors-on-primary)]' : 'bg-[var(--colors-surface-pressed)] text-[var(--colors-ink-muted)]'}`}>
                {step}
              </div>
              {step < 4 && <div className={`h-1 w-16 md:w-32 rounded-full mx-2 ${currentStep > step ? 'bg-[var(--colors-primary)]' : 'bg-[var(--colors-surface-pressed)]'}`} />}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-12 text-center">
          {currentStep === 1 && (
            <div className="w-full">
              <h2 className="text-[length:var(--typography-heading-2)] mb-2">Welcome to Quirk</h2>
              <p className="text-[color:var(--colors-ink-muted)] mb-8">Let's set up your profile.</p>
              {/* TODO: StepWelcome placeholder */}
              <div className="h-48 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
                StepWelcome Component Placeholder
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="w-full">
              <h2 className="text-[length:var(--typography-heading-2)] mb-2">Create Workspace</h2>
              <p className="text-[color:var(--colors-ink-muted)] mb-8">Name your organization space.</p>
              {/* TODO: StepWorkspace placeholder */}
              <div className="h-48 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
                StepWorkspace Component Placeholder
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="w-full">
              <h2 className="text-[length:var(--typography-heading-2)] mb-2">Choose a Template</h2>
              <p className="text-[color:var(--colors-ink-muted)] mb-8">Start with a pre-configured board.</p>
              {/* TODO: StepTemplate placeholder */}
              <div className="h-48 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
                StepTemplate Component Placeholder
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="w-full">
              {/* TODO: StepSuccess placeholder */}
              <div className="h-64 border-dashed border-2 border-[var(--colors-hairline)] rounded flex items-center justify-center text-[color:var(--colors-ink-faint)]">
                StepSuccess Component Placeholder
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        {currentStep < 4 && (
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--colors-hairline)] px-4">
            <Button variant="utility" onClick={prevStep} disabled={currentStep === 1}>
              Back
            </Button>
            <Button variant="primary" onClick={nextStep}>
              {currentStep === 3 ? 'Finish' : 'Next'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
