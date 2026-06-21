/**
 * @file LoginPage.jsx
 * @description Authentication login portal matching the Mint & Ink design system, with a split-screen SaaS layout.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';

/**
 * Main login page component. Checks formats, runs authorization methods.
 * Split-screen design with marketing copy on the left and login form on the right.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.mustResetPassword) {
        navigate('/reset-password', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message, 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper to pre-fill credentials for quick testing
  const autofill = (email, password = 'Password@123') => {
    setForm({ email, password });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex bg-[var(--colors-canvas)] animate-in">
      
      {/* ── Left Panel (Marketing & Branding) ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-[var(--colors-ink)] dark:bg-[var(--colors-canvas-soft)]">
        
        {/* Glow effect matching the Polarity Flip rhythm */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'radial-gradient(circle at top left, var(--colors-primary-glow), transparent 60%)'
          }}
        />

        {/* Top Logo */}
        <div className="relative z-10 mb-8">
          <img src="/full logo  - white.webp" alt="Quirk" className="h-12 w-auto object-contain" />
        </div>

        {/* Center Copy */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-[var(--typography-display-xl)] font-bold text-[var(--colors-on-dark)] leading-tight tracking-tight">
            The operating layer for your team.
          </h1>
          <p className="mt-6 text-[var(--typography-body-lg)] text-[var(--colors-on-dark-body)] leading-relaxed">
            Collaborate, organize, and track tasks in real time. Experience the clarity of a unified workspace designed for modern teams.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[var(--typography-caption)] text-[var(--colors-on-dark-mute)] font-medium tracking-wide uppercase">
            © 2026 Quirk Systems
          </p>
        </div>
      </div>

      {/* ── Right Panel (Login Form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden flex justify-center mb-10">
            <BrandLogo size="lg" />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] dark:text-[var(--colors-on-dark)]">
              Welcome back
            </h2>
            <p className="mt-2 text-[var(--typography-body-md)] text-[var(--colors-body)] dark:text-[var(--colors-on-dark-body)]">
              Please enter your credentials to access your workspace.
            </p>
          </div>

          <div className="p-8 space-y-6 rounded-[var(--radius-xl)] bg-[var(--colors-canvas-soft)] dark:bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] shadow-lg dark:shadow-[0_0_0_2px_var(--colors-primary-glow)]">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                id="login-email"
                label="Email address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
                placeholder="you@company.com"
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                }
              />

              <Input
                id="login-password"
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full h-11"
              >
                Sign in
              </Button>
            </form>
          </div>

          {/* Quick Login Cheat-sheet */}
          <div className="mt-8 p-4 rounded-xl border border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas-softer)] text-center">
            <p className="text-[11px] font-semibold text-[var(--colors-body)] dark:text-[var(--colors-on-dark-body)] uppercase tracking-wider mb-3">
              Quick Login Demo Credentials
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="subtle" size="sm" onClick={() => autofill('admin@quirk.com')}>
                Admin
              </Button>
              <Button variant="subtle" size="sm" onClick={() => autofill('pm@quirk.com')}>
                Project Manager
              </Button>
              <Button variant="subtle" size="sm" onClick={() => autofill('collab@quirk.com')}>
                Collaborator
              </Button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
