# Workspace And Project Business Rules

Quirk is a multi-tenant SaaS. Workspace membership is the tenant boundary, and
project membership controls day-to-day project work.

## Workspace Lifecycle

- Self-service registration creates a user account, then email verification sends
  the user to onboarding.
- Onboarding creates a workspace owned by the registrant.
- The workspace creator receives the workspace `Owner` role.
- Workspace Owners/Admins can create projects inside the workspace.
- Workspace Owners/Admins can invite or manage workspace members.
- Any authenticated user can create an additional workspace and becomes its
  Owner.

## Project Lifecycle

- Every new project belongs to a workspace.
- Project creators become `Project Manager` members of that project.
- Workspace Owners/Admins can manage all projects in their workspace.
- Project Managers can manage only projects where they have the `Project Manager`
  project role.
- Collaborators can access projects they belong to but cannot edit project
  settings, delete projects, or change workflow structure.
- Project Managers and workspace Owners/Admins can manage project workflow
  columns after creation, including adding, renaming, reordering, and deleting
  columns.
- Archiving a project sets `status = archived`; deleting uses the existing
  project soft-delete behavior.

## Task Rules

- Tasks created from the UI require a project and workflow column.
- Task status is represented by the Kanban column.
- General task views list all tasks the caller can access.
- Project task views filter by `projectId`.
- Assignees must be members of the selected project.
- Assigned users receive assignment notifications.
- Column changes notify involved users except the actor.
- Collaborators may open accessible tasks and comment on them. Full task editing,
  deletion, and assignment remain manager actions.
- Deadline notifications are persisted and emitted by the existing deadline
  checker for incomplete tasks due within 24 hours.

## Chat Rules

- DMs are scoped to users who share a workspace.
- Project rooms are scoped to project members.
- Creating/opening a project room seeds participants from current project
  membership.
- Adding or removing project members updates the project room participants.

## Authorization Summary

| Action | Platform Admin | Workspace Owner/Admin | Project Manager | Collaborator |
| --- | --- | --- | --- | --- |
| Create workspace | Yes | Yes | Yes | Yes |
| Create project in workspace | Yes | Yes | No | No |
| Edit/archive/delete project | Yes | Yes | Own managed projects | No |
| Assign project members | Yes | Yes | Own managed projects | No |
| Create/edit/delete project tasks | Yes | Yes | Own managed projects | No |
| Move assigned tasks | Yes | Yes | Yes | Assigned only |
| Comment/chat in accessible project | Yes | Yes | Yes | Yes |
