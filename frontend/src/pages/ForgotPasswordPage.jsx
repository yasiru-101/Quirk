import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { normalizeError } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  
  const [form, setForm] = useState({ email: '', code: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    if (!form.email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      if (data.devOtp) {
        success(`DEV ONLY: OTP is ${data.devOtp}`);
      }
      success('If an account exists, an OTP will be sent to your email.');
      setStep(2);
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.code) nextErrors.code = 'Code is required';
    if (!form.newPassword) nextErrors.newPassword = 'New password is required';
    
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password-otp', {
        email: form.email,
        code: form.code,
        newPassword: form.newPassword
      });
      success('Password reset successfully. You can now log in.');
      navigate('/login');
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen animate-in bg-[var(--colors-canvas)]">
      <div className="relative flex flex-1 flex-col justify-center overflow-y-auto p-8 sm:p-12 lg:p-16 xl:p-24">
        <div className="mx-auto w-full max-w-[420px] slide-up">
          <div className="mb-10 flex flex-col items-start gap-2">
            <BrandLogo size="xl" className="-ml-4" />
            <div>
              <h1 className="text-[length:var(--typography-display-2)] font-normal text-[var(--colors-ink)]">
                {step === 1 ? 'Forgot Password' : 'Reset Password'}
              </h1>
              <p className="mt-3 text-[length:var(--typography-body-lg)] text-[var(--colors-body)]">
                {step === 1 
                  ? 'Enter your email address to receive a one-time password (OTP) to reset your password.' 
                  : `Enter the 6-digit code sent to ${form.email} along with your new password.`}
              </p>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6" noValidate>
              <Input
                id="forgot-email"
                label="Email address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
              />
              <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-base font-semibold">
                Send OTP
              </Button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full text-sm font-semibold text-[var(--colors-primary-active)] hover:underline"
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
              <Input
                id="reset-code"
                label="Verification Code (OTP)"
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                error={errors.code}
                placeholder="000000"
                maxLength={6}
                className="h-14 text-center text-2xl tracking-widest"
              />
              <Input
                id="reset-new-password"
                label="New Password"
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                placeholder="Enter new password"
              />
              <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-base font-semibold">
                Reset Password
              </Button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm font-semibold text-[var(--colors-primary-active)] hover:underline"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
