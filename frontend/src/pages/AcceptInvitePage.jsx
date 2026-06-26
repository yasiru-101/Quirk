/**
 * @file AcceptInvitePage.jsx
 * @description Accepts a workspace invitation from an emailed link.
 * For new users, it provides a frictionless inline registration.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { normalizeError } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import BrandLogo from '../components/common/BrandLogo';
import { validatePassword } from '../utils/helpers';
import { PASSWORD_POLICY } from '../utils/constants';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, setSession } = useAuth();
  const { refreshWorkspaces, setActiveWorkspaceId } = useProject();
  
  // Status: working | unauthenticated | error
  const [status, setStatus] = useState('working'); 
  const [message, setMessage] = useState('Joining workspace…');
  const attempted = useRef(false);

  // Invite Details
  const [inviteDetails, setInviteDetails] = useState(null);

  // Inline Registration Form
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || attempted.current) return;
    if (!token) {
      setStatus('error');
      setMessage('This invitation link is missing its token.');
      return;
    }
    
    if (!isAuthenticated) {
      // Unauthenticated: Verify the invite to see if they are a new or existing user
      (async () => {
        try {
          const { data } = await api.get(`/workspaces/invitations/verify?token=${token}`);
          setInviteDetails(data);
          setStatus('unauthenticated');
        } catch (err) {
          setStatus('error');
          setMessage(normalizeError(err).message || 'This invitation is invalid or has expired.');
        }
      })();
      return;
    }

    // Authenticated: Just accept the invite!
    attempted.current = true;
    (async () => {
      try {
        const { data } = await api.post('/workspaces/invitations/accept', { token });
        await refreshWorkspaces();
        if (data?.workspaceId) setActiveWorkspaceId(data.workspaceId);
        navigate('/projects', { replace: true });
      } catch (err) {
        setStatus('error');
        setMessage(normalizeError(err).message || 'This invitation is invalid or has expired.');
      }
    })();
  }, [authLoading, isAuthenticated, token, navigate, refreshWorkspaces, setActiveWorkspaceId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    // For a "pending setup" account the user (and name) already exist, so a name is
    // optional here; for a brand-new self-registration it is required.
    const isSetup = !!inviteDetails?.pendingSetup;
    const nextErrors = {};
    if (!isSetup && !form.name) nextErrors.name = 'Name is required';
    if (!form.password) nextErrors.password = 'Password is required';
    else {
      const passwordErrors = validatePassword(form.password);
      if (passwordErrors.length) nextErrors.password = passwordErrors.join(', ');
    }
    if (form.password && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords don't match";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = isSetup
        ? await authService.setInvitedPassword(form.name, form.password, form.confirmPassword, token)
        : await authService.registerInvited(form.name, form.password, form.confirmPassword, token);
      setSession(data.user);
      await refreshWorkspaces();
      if (data?.workspaceId) setActiveWorkspaceId(data.workspaceId);
      navigate('/projects', { replace: true });
    } catch (err) {
      const { message: errMsg, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else setErrors({ form: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.form) setErrors((prev) => ({ ...prev, form: '' }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--colors-canvas)] p-6">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-8 text-center">
        <BrandLogo size="md" className="mx-auto mb-6" />
        
        {status === 'working' && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--colors-primary)] border-t-transparent" />
            <p className="text-[var(--colors-body)]">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Invitation problem</h1>
            <p className="mt-2 text-sm text-[var(--colors-body)]">{message}</p>
            <Button variant="primary" className="mt-6 w-full" onClick={() => navigate('/')}>Go to Quirk</Button>
          </>
        )}

        {status === 'unauthenticated' && inviteDetails?.pendingSetup && (
          <div className="text-left">
            <h1 className="text-center text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Set your password</h1>
            <p className="mb-6 mt-2 text-center text-sm text-[var(--colors-body)]">
              An account was created for you in <strong>{inviteDetails.workspaceName}</strong>. Choose a
              password to finish setting up and sign in.
            </p>

            {errors.form && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--colors-ink)]">Email Address</label>
                <div className="rounded-[var(--radius-md)] border border-[var(--colors-hairline)] bg-[var(--colors-surface)] px-3 py-2 text-sm text-[var(--colors-body)] opacity-70">
                  {inviteDetails.email}
                </div>
              </div>

              <Input
                id="setup-name"
                label="Full Name (optional)"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Jane Doe"
              />

              <Input
                id="setup-password"
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Create a strong password"
              />
              <p className="text-xs text-[var(--colors-body)] -mt-2">{PASSWORD_POLICY.HINT}</p>

              <Input
                id="setup-confirm-password"
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
              />

              <Button type="submit" variant="primary" loading={submitting} className="mt-2 w-full">
                Set Password & Continue
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-[var(--colors-body)]">
              Prefer the temporary password from your email?{' '}
              <button
                type="button"
                className="font-medium text-[var(--colors-primary)] underline"
                onClick={() => navigate('/login')}
              >
                Sign in instead
              </button>
            </p>
          </div>
        )}

        {status === 'unauthenticated' && inviteDetails?.existingUser && !inviteDetails?.pendingSetup && (
          <>
            <h1 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Welcome back!</h1>
            <p className="mt-2 text-sm text-[var(--colors-body)]">
              You&apos;ve been invited to join <strong>{inviteDetails.workspaceName}</strong>.
            </p>
            <Button 
              variant="primary" 
              className="mt-6 w-full" 
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`)}
            >
              Sign in to accept
            </Button>
          </>
        )}

        {status === 'unauthenticated' && !inviteDetails?.existingUser && (
          <div className="text-left">
            <h1 className="text-center text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">You&apos;ve been invited!</h1>
            <p className="mb-6 mt-2 text-center text-sm text-[var(--colors-body)]">
              Join <strong>{inviteDetails.workspaceName}</strong>. Create your account to get started.
            </p>

            {errors.form && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--colors-ink)]">Email Address</label>
                <div className="rounded-[var(--radius-md)] border border-[var(--colors-hairline)] bg-[var(--colors-surface)] px-3 py-2 text-sm text-[var(--colors-body)] opacity-70">
                  {inviteDetails.email}
                </div>
              </div>

              <Input
                id="invite-name"
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Jane Doe"
              />

              <Input
                id="invite-password"
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Create a strong password"
              />
              <p className="text-xs text-[var(--colors-body)] -mt-2">{PASSWORD_POLICY.HINT}</p>

              <Input
                id="invite-confirm-password"
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
              />

              <Button type="submit" variant="primary" loading={submitting} className="mt-2 w-full">
                Join Workspace
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
