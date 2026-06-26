/**
 * @file WorkspaceMembersPage.jsx
 * @description Workspace membership management. Owners/Admins can invite people
 * by email, change member roles, and remove members. Tenant-scoped to the active
 * workspace (ADR 0002).
 */
import React, { useEffect, useState } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import SelectField from '../components/common/SelectField';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { normalizeError } from '../services/api';
import { getInitials, getRoleBadgeStyle } from '../utils/helpers';

const INVITE_ROLES = ['Admin', 'Project Manager', 'Collaborator'];

export default function WorkspaceMembersPage() {
  const { user } = useAuth();
  const {
    activeWorkspace,
    activeWorkspaceId,
    workspaceMembers,
    pendingInvites,
    canManageWorkspace,
    fetchWorkspaceMembers,
    inviteWorkspaceMember,
    updateWorkspaceMemberRole,
    removeWorkspaceMember,
  } = useProject();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Collaborator' });
  const [inviteErrors, setInviteErrors] = useState({});
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchWorkspaceMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteForm({ email: '', role: 'Collaborator' });
    setInviteErrors({});
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    if (!inviteForm.email.trim()) {
      setInviteErrors({ email: 'Email is required' });
      return;
    }
    setInviting(true);
    try {
      const data = await inviteWorkspaceMember({ email: inviteForm.email.trim(), role: inviteForm.role });
      // In development the backend returns the raw accept token to ease testing.
      if (data.acceptToken) {
        success(`Invitation created. Accept link: /invite/accept?token=${data.acceptToken}`, 'Invite sent');
      } else {
        success(`Invitation sent to ${inviteForm.email.trim()}`, 'Invite sent');
      }
      closeInvite();
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setInviteErrors(fieldErrors);
      else toastError(message, 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (member, role) => {
    try {
      await updateWorkspaceMemberRole(member.userId, role);
      success(`${member.user?.name || 'Member'} is now ${role}`);
    } catch (err) {
      toastError(normalizeError(err).message, 'Could not update role');
    }
  };

  const remove = async (member) => {
    const ok = await confirm({
      title: 'Remove member',
      message: `Remove ${member.user?.name || 'this member'} from ${activeWorkspace?.name}?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await removeWorkspaceMember(member.userId);
      success('Member removed');
    } catch (err) {
      toastError(normalizeError(err).message, 'Could not remove member');
    }
  };

  return (
    <div className="page-shell animate-in space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--colors-ink-muted)]">Workspace</p>
          <h1 className="text-[length:var(--typography-heading-1)] font-normal text-[color:var(--colors-ink)]">Members</h1>
          <p className="mt-2 max-w-2xl text-[var(--colors-body)]">
            People with access to {activeWorkspace?.name || 'this workspace'}. Invite teammates by email; they join only after accepting.
          </p>
        </div>
        {canManageWorkspace && (
          <Button variant="primary" onClick={() => setInviteOpen(true)}>Invite member</Button>
        )}
      </div>

      {workspaceMembers.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Invite teammates to collaborate in this workspace."
          action={canManageWorkspace && <Button variant="primary" onClick={() => setInviteOpen(true)}>Invite member</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--colors-hairline)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)]">
                {['Member', 'Role', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-[length:var(--typography-body-sm)] font-semibold uppercase tracking-wider text-[var(--colors-ink-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--colors-hairline)]">
              {workspaceMembers.map((member) => {
                const isSelf = member.userId === user?.id;
                const isOwner = member.role === 'Owner';
                const canEdit = canManageWorkspace && !isSelf && !isOwner;
                return (
                  <tr key={member.userId} className="hover:bg-[var(--colors-canvas-soft)]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--colors-surface-dark)] text-xs font-bold text-white">
                          {getInitials(member.user?.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--colors-ink)]">{member.user?.name}{isSelf && ' (you)'}</p>
                          <p className="text-sm text-[var(--colors-body)]">{member.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {canEdit ? (
                        <SelectField
                          value={member.role}
                          onChange={(e) => changeRole(member, e.target.value)}
                          options={['Admin', 'Project Manager', 'Collaborator'].map((r) => ({ value: r, label: r }))}
                          className="w-[170px]"
                        />
                      ) : (
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getRoleBadgeStyle(member.role)}`}>{member.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canEdit && (
                        <Button variant="danger" size="sm" onClick={() => remove(member)}>Remove</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pendingInvites?.map((invite) => (
                <tr key={invite.id} className="bg-[rgba(255,255,255,0.02)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--colors-surface-pressed)] text-xs font-bold text-[var(--colors-ink-muted)]">
                        {getInitials(invite.email)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--colors-ink)] italic">Pending Invitation</p>
                        <p className="text-sm text-[var(--colors-body)]">{invite.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 opacity-60">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getRoleBadgeStyle(invite.role)}`}>{invite.role}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">Pending</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={closeInvite}
        title="Invite member"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button variant="secondary" onClick={closeInvite}>Cancel</Button>
            <Button variant="primary" loading={inviting} onClick={submitInvite}>Send invitation</Button>
          </div>
        }
      >
        <form onSubmit={submitInvite} className="space-y-5" noValidate>
          <Input
            label="Email address"
            type="email"
            name="email"
            value={inviteForm.email}
            onChange={(e) => { setInviteForm((c) => ({ ...c, email: e.target.value })); setInviteErrors({}); }}
            error={inviteErrors.email}
            placeholder="teammate@company.com"
          />
          <div className="space-y-2">
            <label className="text-[length:var(--typography-body-sm)] font-semibold text-[var(--colors-ink)]">Workspace role</label>
            <div className="flex gap-2">
              {INVITE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteForm((c) => ({ ...c, role: r }))}
                  className={`flex-1 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm font-semibold transition focus-ring ${
                    inviteForm.role === r
                      ? 'border-[var(--colors-primary)] bg-[var(--colors-primary-glow)] text-[var(--colors-primary-active)]'
                      : 'border-[var(--colors-hairline)] bg-[var(--colors-canvas)] text-[var(--colors-ink)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--colors-ink-muted)]">Admins can manage members and projects. Members participate in projects they join.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
