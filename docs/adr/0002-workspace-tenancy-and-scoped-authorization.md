# 2. Workspace tenancy and scoped authorization

- Status: Accepted
- Date: 2026-06-23
- Updated: 2026-06-25

## Context

The application began as a single-tenant tool with one global role per user
(`Admin`, `Project Manager`, `Collaborator`). Authorization checked only that
role, never whether the user had any relationship to the resource being acted on.
As a result, a user with the right global role could act on projects and tasks
outside their own organization. This is broken object-level authorization.

Quirk is now a multi-tenant SaaS product. Users can belong to multiple
workspaces, and each workspace is an isolated tenant.

## Decision

Use scoped membership records for tenant authorization:

- **Workspace membership** (`WorkspaceMember.role`): `Admin`,
  `Project Manager`, `Collaborator`.
- **Project membership** (`ProjectMember.role`): `Project Manager`,
  `Collaborator`.

Platform-wide administration is separate from tenant roles and is represented by
`User.isPlatformAdmin`. Platform administrators can manage users and support
tenants across the SaaS platform. A workspace `Admin` is not automatically a
platform administrator.

Authorization is enforced by dedicated middleware:

- `requireWorkspaceRole(...roles)` resolves the caller's workspace membership.
- `requireProjectRole(...roles)` resolves the caller's project membership and
  grants workspace Admins access to projects inside their workspace.
- `requireTaskAccess(...roles)` resolves a task to its project before checking
  access.
- `requirePlatformAdmin` protects SaaS-wide user administration under `/users`.

Users join a workspace by accepting a tokenized invitation. Only the SHA-256 hash
of an invitation token is stored, so the database alone cannot be used to accept
an invitation.

Legacy `WorkspaceMember.role = 'Owner'` rows are treated as Admin-equivalent so
existing data remains usable, but new workspaces and invitations use the SRS
roles.

## Consequences

- Reads and writes are scoped to resources the caller can legitimately access.
- `GET /projects` returns only projects the caller can reach through platform,
  workspace, or project access.
- Workspace Admins can manage workspace members, invitations, and projects in
  their workspace.
- Workspace Project Managers can create projects in workspaces where they have
  `Project Manager` membership.
- Collaborators can participate in accessible projects and assigned tasks.
- Platform administration no longer depends on overloading the tenant `Admin`
  role.
