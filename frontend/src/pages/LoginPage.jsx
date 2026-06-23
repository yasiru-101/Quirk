/**
 * @file LoginPage.jsx
 * @description Premium authentication portal with a split-screen layout.
 * Strictly adheres to the Green/Uber hybrid theme without using glassmorphism.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';

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

  const autofill = (email, password = 'Password@123') => {
    setForm({ email, password });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex bg-[var(--colors-canvas)] animate-in">
      
      {/* ── Left Panel (Brand Image) ── */}
      <div className="hidden lg:flex w-[45%] xl:w-1/2 relative bg-[var(--colors-ink)]">
        <img
          src="/login screen.webp"
          alt="Workspace Preview"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          draggable={false}
        />
        {/* Subtle gradient overlay to ensure the image feels integrated but not obscured */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.6)] via-transparent to-[rgba(0,0,0,0.2)] mix-blend-multiply" />
        
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight mb-4 drop-shadow-md">
            Supercharge your workflow.
          </h2>
          <p className="text-lg text-[rgba(255,255,255,0.8)] max-w-md drop-shadow-sm">
            Everything your team needs to plan, track, and execute projects flawlessly in one beautifully crafted workspace.
          </p>
        </div>
      </div>

      {/* ── Right Panel (Login Form) ── */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-24 relative overflow-y-auto">
        
        <div className="w-full max-w-[420px] mx-auto slide-up">
          <div className="mb-10">
            <BrandLogo size="xl" className="-ml-2 mb-2" />
            <h1 className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] tracking-tight">
              Sign in
            </h1>
            <p className="mt-3 text-[var(--typography-body-lg)] text-[var(--colors-body)]">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              id="login-email"
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
              placeholder="Enter your email"
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full h-12 text-base font-semibold mt-2 shadow-[0_4px_14px_var(--colors-primary-glow)]"
            >
              Sign in
            </Button>
          </form>

          {/* Quick-login helpers — development builds only; never shipped to production. */}
          {import.meta.env.DEV && (
            <div className="mt-12 pt-8 border-t border-[var(--colors-hairline)]">
              <p className="text-[11px] font-bold text-[var(--colors-mute)] uppercase tracking-widest mb-4">
                Quick Test Accounts
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="secondary" size="sm" onClick={() => autofill('admin@quirk.app', 'AdminPass123!')}>
                  Admin
                </Button>
                <Button variant="secondary" size="sm" onClick={() => autofill('pm@quirk.app', 'ManagerPass123!')}>
                  PM
                </Button>
                <Button variant="secondary" size="sm" onClick={() => autofill('dev@quirk.app', 'CollabPass123!')}>
                  Collab
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
