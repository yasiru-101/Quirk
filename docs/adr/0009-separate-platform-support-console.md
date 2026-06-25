# 9. Separate platform support console from tenant workspaces

## Status

Accepted

## Context

Quirk has two different administration concerns:

- Workspace administration belongs to a tenant workspace. Workspace Admins
  manage members, invitations, projects, and project-level work inside that
  workspace.
- Platform administration belongs to the SaaS operator. Platform administrators
  support users and tenants across the whole platform.

Putting platform administration inside the normal workspace shell makes the
platform admin look like another workspace user with a bigger task board. That
blurs tenant boundaries, makes the sidebar noisy, and encourages platform
operators to browse tenant work as if it were their daily workspace.

## Decision

Platform administrators use a dedicated platform console under `/platform`.
The console has its own layout, navigation, and information architecture:

- `/platform` for SaaS overview metrics.
- `/platform/workspaces` for tenant support and workspace footprint review.
- `/platform/users` for user support and platform-admin management.
- `/platform/audit` for recent support-relevant activity.

The platform console intentionally does not show the workspace switcher, project
tree, workspace task board navigation, or tenant task creation action.

Workspace Admins continue to use the workspace app shell for tenant-level
administration. A platform administrator may still have personal or customer
workspaces, but that is separate from SaaS operator work.

## Consequences

- Platform support workflows have a clear control-plane UI.
- Tenant workspace workflows remain focused on projects, tasks, chat, and
  workspace members.
- Future platform features should be added to the platform console unless they
  are truly tenant-workspace features.
- Backend platform routes remain protected by `requirePlatformAdmin`; tenant
  routes still enforce object-level workspace, project, and task authorization.
