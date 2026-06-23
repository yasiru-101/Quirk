/**
 * @file RegisterPage.jsx
 * @description Premium registration portal matching the split-screen layout of LoginPage.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';

export default function RegisterPage() {
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await authService.register(form.name, form.email, form.password);
      // Registration successful, requires email verification
      navigate('/verify-email', { state: { email: data.email || form.email }, replace: true });
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message, 'Registration failed');
    } finally {
      setLoading(false);
    }
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
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.6)] via-transparent to-[rgba(0,0,0,0.2)] mix-blend-multiply" />
        
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight mb-4 drop-shadow-md">
            Start your journey.
          </h2>
          <p className="text-lg text-[rgba(255,255,255,0.8)] max-w-md drop-shadow-sm">
            Join thousands of teams who plan, track, and execute projects flawlessly in one beautifully crafted workspace.
          </p>
        </div>
      </div>

      {/* ── Right Panel (Register Form) ── */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-24 relative overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto slide-up">
          <div className="mb-10">
            <BrandLogo size="xl" className="-ml-2 mb-2" />
            <h1 className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] tracking-tight">
              Create an account
            </h1>
            <p className="mt-3 text-[var(--typography-body-lg)] text-[var(--colors-body)]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--colors-primary)] hover:text-[var(--colors-primary-hover)]">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              id="register-name"
              label="Full name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              autoComplete="name"
              placeholder="Enter your name"
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />

            <Input
              id="register-email"
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
              id="register-password"
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
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
              Sign up
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
