# 7. Role escalation prevention and leave-workspace

- Status: Accepted
- Date: 2026-06-25

> Update: ADR 0008 replaces new `Owner` assignment with SRS workspace roles.
> The invariant is now "a workspace must retain at least one Admin"; legacy
> `Owner` rows count as admins for compatibility.

## Context

The workspace invitation endpoint accepted any role including Owner, which meant an
Admin could invite an external user directly as an Owner — escalating workspace
control outside the intended transfer path. The updateMemberRole endpoint similarly
allowed any workspace Admin to promote any member to Owner without restriction.

Additionally, users had no self-service path to leave a workspace they no longer
needed access to. The only way to be removed was through an Admin action, which
created friction and trust concerns.

## Decision

1. **Invitation role restricted**: The inviteMemberSchema ole field is validated
   against ['Admin', 'Member'] only. The Owner role cannot be granted through an
   invitation.

2. **Role update caller-rank check**: updateMemberRole now checks that only a user
   whose own workspace role is Owner may set another member's role to Owner.
   Admins may promote members to Admin or demote them, but not grant ownership.

3. **Leave workspace route added**: DELETE /api/workspaces/:id/leave allows any
   workspace member to remove themselves. The sole Owner is blocked from leaving
   until they transfer ownership to at least one other member.

4. **Frontend leave button**: The sidebar displays a Leave workspace button for
   non-Owner members.

## Consequences

- Ownership can only be transferred by an existing Owner, not handed out by invite
  or by an Admin acting unilaterally.
- All existing invitations already in-flight remain valid as they were sent before
  this restriction.
- Users can self-service remove themselves from workspaces they no longer use,
  reducing Admin overhead.
