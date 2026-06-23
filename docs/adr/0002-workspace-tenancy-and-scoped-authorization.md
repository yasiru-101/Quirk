# 2. Workspace tenancy and scoped authorization

- Status: Accepted
- Date: 2026-06-23

## Context

The application began as a single-tenant tool with one global role per user
(`Admin`, `Project Manager`, `Collaborator`). Authorization checked only that
role, never whether the user had any relationship to the resource being acted on.
As a result any Project Manager could modify or delete any project or task in the
system, and every user could list every project. This is broken object-level
authorization.

The product is moving to a multi-tenant model where users belong to one or more
workspaces and collaborate on projects within them.

## Decision

Introduce two scopes of membership, each carrying its own role:

- **Workspace membership** (`WorkspaceMember.role`): `Owner`, `Admin`, `Member`.
- **Project membership** (`ProjectMember.role`): `Project Manager`, `Collaborator`.

The global `User.role` is retained for one purpose only: a platform `Admin` who
performs system-wide user administration and support. Platform Admins bypass
membership checks; all other users are authorized against their membership of the
specific workspace or project named in the request.

Authorization is enforced by dedicated middleware (`middleware/membership.js`):

- `requireWorkspaceRole(...roles)` resolves the caller's workspace membership.
- `requireProjectRole(...roles)` resolves the caller's project membership, and
  additionally grants access to Owners/Admins of the project's workspace.

Users join a workspace by accepting a tokenised invitation. Only the SHA-256 hash
of an invitation token is stored, so the database alone cannot be used to accept
an invitation.

## Consequences

- Reads and writes are scoped to resources the caller can legitimately access;
  `GET /projects` returns only the caller's projects.
- The project routes no longer use the global `rbac` guard; they use
  `requireProjectRole`. The global `rbac` guard remains in use for platform-level
  user administration under `/users`.
- Task-level authorization (a task is reached without its project in the URL) is
  addressed in a follow-up change so it can be designed and tested in isolation.
- Ownership is never granted by invitation; it is transferred deliberately.
