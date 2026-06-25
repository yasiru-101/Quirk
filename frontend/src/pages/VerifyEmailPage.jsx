/**
 * @file VerifyEmailPage.jsx
 * @description OTP verification portal for email verification during registration.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';

export default function VerifyEmailPage() {
  const { setSession } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const redirect = location.state?.redirect;
  const from = redirect || location.state?.from?.pathname || '/onboarding';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // If we arrived here without an email in state, redirect back to login
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.verifyEmail(email, code);
      setSession(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors?.code) setError(fieldErrors.code);
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(email);
      toastSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      const { message } = normalizeError(err);
      toastError(message, 'Failed to resend code');
    } finally {
      setResending(false);
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
      </div>

      {/* ── Right Panel (Verification Form) ── */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-24 relative overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto slide-up">
          <div className="mb-10">
            <BrandLogo size="xl" className="-ml-2 mb-2" />
            <h1 className="text-[var(--typography-display-lg)] font-bold text-[var(--colors-ink)] tracking-tight">
              Check your email
            </h1>
            <p className="mt-3 text-[var(--typography-body-lg)] text-[var(--colors-body)]">
              We've sent a 6-digit verification code to <span className="font-semibold text-[var(--colors-ink)]">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              id="verify-code"
              label="Verification Code"
              type="text"
              name="code"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
                setError('');
              }}
              error={error}
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest h-14"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full h-12 text-base font-semibold mt-2 shadow-[0_4px_14px_var(--colors-primary-glow)]"
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-8 text-center text-[var(--typography-body)] text-[var(--colors-body)]">
            Didn't receive the email?{' '}
            <button 
              type="button" 
              onClick={handleResend} 
              disabled={resending}
              className="font-semibold text-[var(--colors-primary)] hover:text-[var(--colors-primary-hover)] disabled:opacity-50"
            >
              Click to resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
