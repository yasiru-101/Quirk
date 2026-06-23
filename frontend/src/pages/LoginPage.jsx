/**
 * @file LoginPage.jsx
 * @description Authentication portal with a split-screen layout.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';
import { authService } from '../services/authService';

export default function LoginPage() {
  const { login, setSession } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email) nextErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (!form.password) nextErrors.password = 'Password is required';
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
      const data = await login(form.email, form.password);
      if (data.twoFactorRequired) {
        setTwoFactorData({ pendingToken: data.pendingToken, email: data.email });
        return;
      }
      navigate(data.mustResetPassword ? '/reset-password' : from, { replace: true });
    } catch (err) {
      const { message, fieldErrors, code, email } = normalizeError(err);
      if (code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email: email || form.email }, replace: true });
        return;
      }
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message, 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (event) => {
    event.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit code' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await authService.verify2fa(twoFactorData.pendingToken, otpCode);
      setSession(data.user);
      navigate(data.user.mustResetPassword ? '/reset-password' : from, { replace: true });
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors?.code) setErrors({ otp: fieldErrors.code });
      else toastError(message, 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (email, password) => {
    setForm({ email, password });
    setErrors({});
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
            A calmer way to run team work.
          </h2>
          <p className="max-w-md text-lg text-white/78">
            Plan tasks, track workflow columns, and keep team discussion close to the work.
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center overflow-y-auto p-8 sm:p-12 lg:p-16 xl:p-24">
        <div className="mx-auto w-full max-w-[420px] slide-up">
          <div className="mb-10 flex flex-col items-start gap-2">
            <BrandLogo size="xl" className="-ml-4" />
            <div>
              <h1 className="text-[length:var(--typography-display-2)] font-normal text-[var(--colors-ink)]">
                Sign in
              </h1>
              <p className="mt-3 text-[length:var(--typography-body-lg)] text-[var(--colors-body)]">
                Welcome back. Enter your details to continue.
              </p>
            </div>
          </div>

          {twoFactorData ? (
            <form onSubmit={handle2FASubmit} className="space-y-6" noValidate>
              <p className="text-sm text-[var(--colors-body)]">
                A verification code has been sent to <span className="font-semibold">{twoFactorData.email}</span>.
              </p>
              <Input
                id="login-otp"
                label="Verification code"
                type="text"
                name="otp"
                value={otpCode}
                onChange={(event) => {
                  setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setErrors({});
                }}
                error={errors.otp}
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                className="h-14 text-center text-2xl tracking-widest"
              />
              <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-base font-semibold">
                Verify and sign in
              </Button>
              <button
                type="button"
                onClick={() => {
                  setTwoFactorData(null);
                  setOtpCode('');
                  setErrors({});
                }}
                className="w-full text-sm font-semibold text-[var(--colors-primary-active)] hover:underline"
              >
                Back to login
              </button>
            </form>
          ) : (
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
                placeholder="Enter your password"
              />

              <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-base font-semibold">
                Sign in
              </Button>
            </form>
          )}

          {import.meta.env.DEV && (
            <div className="mt-12 border-t border-[var(--colors-hairline)] pt-8">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[var(--colors-mute)]">
                Quick test accounts
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="secondary" size="sm" onClick={() => autofill('admin@quirk.app', 'AdminPass123!')}>Admin</Button>
                <Button variant="secondary" size="sm" onClick={() => autofill('pm@quirk.app', 'ManagerPass123!')}>PM</Button>
                <Button variant="secondary" size="sm" onClick={() => autofill('dev@quirk.app', 'CollabPass123!')}>Collab</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
