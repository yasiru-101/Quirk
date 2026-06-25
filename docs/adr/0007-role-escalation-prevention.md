# 7. Workspace admin retention and leave-workspace

- Status: Accepted
- Date: 2026-06-25
- Updated: 2026-06-25

## Context

Workspace membership is scoped to the tenant and uses the SRS roles: `Admin`,
`Project Manager`, and `Collaborator`. Workspace Admins can invite members,
change member roles, and remove members.

Without safeguards, a workspace could accidentally lose all Admin members. That
would leave the tenant without anyone who can manage membership, invitations, or
project administration. Users also need a self-service path to leave workspaces
they no longer use.

## Decision

1. **Invitation roles are restricted**: invitations may grant only workspace
   `Admin`, `Project Manager`, or `Collaborator`.

2. **Workspace Admin must be retained**: role updates, member removal, and
   self-service leave all block operations that would leave a workspace without
   at least one Admin.

3. **Leave workspace route added**: `DELETE /api/workspaces/:id/leave` allows any
   workspace member to remove themselves from that workspace.

4. **Frontend leave button**: the sidebar displays a Leave workspace action for
   non-Admin members of the active workspace.

Legacy `Owner` rows count as Admin-equivalent for compatibility, but new data
uses the SRS roles.

## Consequences

- Workspace administration remains recoverable because each workspace must retain
  at least one Admin.
- Users can remove themselves from workspaces they no longer need.
- Workspace role assignment stays aligned with the SRS and no longer exposes a
  separate ownership role.
