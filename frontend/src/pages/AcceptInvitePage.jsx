/**
 * @file AcceptInvitePage.jsx
 * @description Accepts a workspace invitation from an emailed link
 * (/invite/accept?token=...). Requires the user to be signed in as the invited
 * email; on success they join the workspace and land on Projects.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { normalizeError } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import BrandLogo from '../components/common/BrandLogo';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { refreshWorkspaces, setActiveWorkspaceId } = useProject();
  const [status, setStatus] = useState('working'); // working | error
  const [message, setMessage] = useState('Joining workspace…');
  const attempted = useRef(false);

  useEffect(() => {
    if (authLoading || attempted.current) return;
    if (!token) {
      setStatus('error');
      setMessage('This invitation link is missing its token.');
      return;
    }
    if (!isAuthenticated) {
      // Preserve the invite so the user returns here after signing in.
      navigate(`/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`, { replace: true });
      return;
    }
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--colors-canvas)] p-6">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-8 text-center">
        <BrandLogo size="md" className="mx-auto mb-6" />
        {status === 'working' ? (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--colors-primary)] border-t-transparent" />
            <p className="text-[var(--colors-body)]">{message}</p>
          </>
        ) : (
          <>
            <h1 className="text-[length:var(--typography-title)] font-semibold text-[var(--colors-ink)]">Invitation problem</h1>
            <p className="mt-2 text-sm text-[var(--colors-body)]">{message}</p>
            <Button variant="primary" className="mt-6" onClick={() => navigate('/')}>Go to Quirk</Button>
          </>
        )}
      </div>
    </div>
  );
}
