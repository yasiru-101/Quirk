# 4. Task-level object authorization

- Status: Accepted
- Date: 2026-06-23

## Context

ADR 0002 introduced object-level authorization for workspaces and projects, where
the resource id appears in the URL. Tasks and their sub-resources (comments, time
logs, activity, attachments) were still guarded only by the global `User.role`,
which meant any Project Manager could read or modify any task in the system, every
collaborator could list every task, and attachments could be uploaded against any
task. A task is reached without its project in the URL, so it needs a dedicated
resolution step.

## Decision

Add `resolveTaskAccess(user, taskId, roles)` and a `requireTaskAccess(...roles)`
middleware. The task is loaded, mapped to its project, and authorized through the
existing `resolveProjectAccess`:

- **Participant access** (no roles): granted to the task's creator, its assignees,
  members of its project, and Admins of its workspace. Used for reads, status
  updates, comments, time logs, activity, and attachments.
- **Manager access** (`'Project Manager'`): required to update, delete, or assign a
  task. For a task with no project, only its creator qualifies.
- Platform Admins bypass, as elsewhere.

Applied across the task routes and the comment, time-log, activity, and attachment
routes. Attachments resolve the task from the request body (upload) or from the
attachment record (download), since no task id is present in the path. Task creation
inside a project now requires manager access to that project. The task list is scoped
to tasks the caller created, is assigned to, or can reach through project/workspace
membership.

The global `rbac` guard is now used only for platform-level user administration
(`/users`).

## Consequences

- A user can only see and act on tasks they legitimately have access to, closing the
  last broad object-level authorization gap.
- The collaborator-vs-manager distinction for status, comments, and time logs is still
  enforced in the controllers using the existing assignment checks; tightening those to
  read the project-membership role (rather than the global role) is a follow-up.
- `resolveTaskAccess` is reused by middleware and controllers, keeping the rule in one
  place.
