/**
 * @file RegisterPage.jsx
 * @description Registration portal matching the split-screen login layout.
 */
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';
import { validatePassword } from '../utils/helpers';
import { PASSWORD_POLICY } from '../utils/constants';

export default function RegisterPage() {
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect');

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name) nextErrors.name = 'Name is required';
    if (!form.email) nextErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (!form.password) nextErrors.password = 'Password is required';
    else {
      const passwordErrors = validatePassword(form.password);
      if (passwordErrors.length) nextErrors.password = passwordErrors.join(', ');
    }
    if (form.password && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords don't match";
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.register(form.name, form.email, form.password, form.confirmPassword);
      navigate('/verify-email', { state: { email: data.email || form.email, redirect }, replace: true });
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message, 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen animate-in bg-[var(--colors-canvas)]">
      <div className="relative hidden w-[45%] bg-[var(--colors-ink)] lg:flex xl:w-1/2">
        <img
          src="/login screen.webp"
          alt="Quirk workspace preview"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="mb-4 text-3xl font-normal tracking-normal xl:text-4xl">
            Start with a clean workspace.
          </h2>
          <p className="max-w-md text-lg text-white/78">
            Create projects, define workflow columns, and keep task status tied to the board.
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center overflow-y-auto p-8 sm:p-12 lg:p-16 xl:p-24">
        <div className="mx-auto w-full max-w-[420px] slide-up">
          <div className="mb-10 flex flex-col items-start gap-2">
            <BrandLogo size="xl" className="-ml-4" />
            <div>
              <h1 className="text-[length:var(--typography-display-2)] font-normal text-[var(--colors-ink)]">
                Create an account
              </h1>
              <p className="mt-3 text-[length:var(--typography-body-lg)] text-[var(--colors-body)]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[var(--colors-primary-active)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
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
              placeholder="Create a strong password"
            />

            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
              placeholder="Confirm your password"
            />
            <p className="text-xs text-[var(--colors-body)]">{PASSWORD_POLICY.HINT}</p>

            <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-base font-semibold">
              Sign up
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
