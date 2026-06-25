# 8. Separate platform administrators from tenant roles

- Status: Accepted
- Date: 2026-06-25

## Context

Quirk expanded from a single-tenant task-management system into a multi-tenant
SaaS application. The earlier implementation overloaded `User.role = 'Admin'`
to mean both:

- a tenant/workspace administrator, as described by the SRS; and
- a SaaS-wide administrator who could manage every user and bypass membership
  checks.

That made the role model hard to reason about. A workspace Admin should be able
to manage their workspace, but not necessarily every user across the platform.
At the same time, the SaaS operator needs platform-level user management and
support access that is independent of a user's membership in any tenant.

The SRS also defines the product roles as `Admin`, `Project Manager`, and
`Collaborator`, so workspace membership should use those names rather than a
separate `Owner` / `Member` vocabulary.

## Decision

Add `User.isPlatformAdmin` as the platform administration capability.

Tenant roles remain in `User.role` for ordinary product behavior and in
`WorkspaceMember.role` for workspace membership:

- Workspace roles: `Admin`, `Project Manager`, `Collaborator`.
- Project roles: `Project Manager`, `Collaborator`.
- Platform administration: `isPlatformAdmin = true`.

Platform-only routes such as `/api/users` are protected by
`requirePlatformAdmin`. The guard includes a bootstrap bridge: if no active
platform administrator exists yet, an active tenant Admin may access the route
so existing databases can promote the first platform admin. Once a platform
administrator exists, tenant Admins no longer satisfy platform-only access.

Legacy `WorkspaceMember.role = 'Owner'` rows are treated as workspace-admin
equivalent for compatibility, but new workspaces, invitations, and role updates
use the SRS roles.

## Consequences

- Workspace Admin is now a tenant role, not a platform-wide superuser role.
- Platform administrators can manage users and support tenants without requiring
  workspace membership.
- The last active platform administrator cannot be deactivated or stripped of
  platform access.
- The last workspace Admin cannot leave, be removed, or be demoted until another
  workspace Admin exists.
- PMs can create projects in workspaces where they have `Project Manager`
  workspace membership, matching the SRS.
