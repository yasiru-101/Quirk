# Quirk Task Management System
## Software Requirements Specification (SRS)

**Course:** Group Assignment | INTE 21323  
**Final Submission Deadline:** 2026-06-27  
**Product Scope:** Multi-tenant task-management SaaS

---

## 1. Introduction

Quirk is a full-stack task-management system for teams that need to plan,
assign, discuss, and track work across multiple organizations or workspaces.
The product has evolved from a single-tenant task board into a multi-tenant SaaS
application: each workspace is an isolated tenant, and users may belong to more
than one workspace with different roles.

Quirk supports project-based work management similar to Trello, Asana, and Jira.
It provides dynamic Kanban workflows, task assignment, comments, attachments,
real-time notifications, and platform administration for SaaS operators.

The system enables:

- Self-service registration, email verification, login, logout, password reset,
  and optional email-based two-factor authentication.
- Multi-tenant workspace creation, membership management, invitations, and
  self-service workspace exit.
- Platform administrator management across all tenants.
- Project creation and project-level member management.
- Dynamic Kanban columns as the single source of task workflow state.
- Task creation, assignment, filtering, sorting, comments, attachments, activity
  logs, time logs, calendar view, and timeline view.
- Real-time notifications and chat through WebSockets.
- Secure API communication, validation, and cloud-ready deployment.

---

## 2. Functional Requirements

### 2.1 Authentication

The system shall allow users to register, verify their email address, log in, and
log out using valid credentials.

The system shall:

- Store passwords using bcrypt.
- Enforce password complexity for registration, password reset, and first-login
  temporary-password reset.
- Block login for inactive users.
- Block login for self-registered users until email verification is complete.
- Support forgot-password through a time-limited one-time code.
- Support optional email-based two-factor authentication.

### 2.2 JWT Session Management

Upon successful authentication, the system shall issue:

- A short-lived access token.
- A refresh token.
- HTTP-only cookies for browser clients.

The backend shall validate token signature, expiration, user existence, and user
active status on each protected request. Refresh shall rotate the session tokens.

### 2.3 Multi-Tenant Authorization

Authorization has three scopes:

| Scope | Purpose | Roles |
| --- | --- | --- |
| Platform | SaaS-wide administration and support | `isPlatformAdmin = true` |
| Workspace | Tenant membership and workspace-level management | `Admin`, `Project Manager`, `Collaborator` |
| Project | Project execution and task control | `Project Manager`, `Collaborator` |

Platform administrators use a separate SaaS control plane for support
operations. They can manage users across the SaaS platform and access
support-focused tenant information without treating their own workspace as the
platform administration surface.

Workspace Admins can manage workspace members, invitations, and projects in that
workspace. Project Managers can create projects in workspaces they belong to and
manage tasks inside projects where they are project managers. Collaborators can
view assigned or accessible work, move permitted workflow state, and collaborate
through comments and attachments.

All authorization shall be object-level. A role check alone is not sufficient:
the backend must verify that the caller belongs to the workspace, project, or
task context being accessed.

### 2.4 Platform Administration Console

Accessible only to platform administrators.

The system shall allow platform administrators to:

- View SaaS overview metrics including users, workspaces, projects, pending
  invitations, and recent growth.
- Search and review tenant workspaces for support, including owner, admins,
  member counts, project counts, and invitation counts.
- Create users with temporary passwords.
- View searchable user lists.
- Assign tenant roles: `Admin`, `Project Manager`, or `Collaborator`.
- Grant or revoke platform administrator access.
- Deactivate users.
- Review recent support-relevant audit events across users, workspaces,
  invitations, and task activity.

The system shall prevent removing or deactivating the last active platform
administrator.

The platform administration console shall be separate from the workspace app
shell. It shall not present the workspace switcher, project tree, tenant task
board, or workspace New Task workflow as its primary interface.

### 2.5 Workspace Management

Authenticated users shall be able to create workspaces. The creator becomes a
workspace Admin.

Workspace Admins shall be able to:

- Invite users by email.
- Assign invited or existing workspace users one of the workspace roles:
  `Admin`, `Project Manager`, or `Collaborator`.
- Change workspace member roles.
- Remove workspace members while preserving at least one Admin.

Workspace members shall be able to leave a workspace. The last workspace Admin
shall be blocked from leaving until another Admin exists.

Invitations shall use secure random tokens. Only a hash of the token shall be
stored in the database. New users may create an account directly from an invite;
existing users must sign in with the invited email before accepting.

### 2.6 Project Management

Workspace Admins and workspace Project Managers shall be able to create projects
inside workspaces they belong to. Platform administrators may create projects
for support purposes.

Projects shall include:

- Name.
- Description.
- Workspace reference.
- Dynamic Kanban columns.
- Project members.
- Optional epics.

Project Managers shall be able to:

- Update project details.
- Archive or delete projects.
- Add or remove project members.
- Create, rename, reorder, and delete Kanban columns.

Project members must also belong to the project workspace.

---

## 3. Task Management

### 3.1 Core Features

Authorized users shall be able to create, view, update, assign, move, and delete
tasks according to their project-level access.

The system shall provide:

- Kanban board view.
- List/table view.
- Calendar view.
- Timeline/Gantt-style view.
- Filtering and sorting by search term, column, assignee, priority, due date,
  and risk signals.

Calendar and timeline views shall consume the same scoped task query API rather
than adding per-view endpoints.

### 3.2 Task Attributes

Each task shall include:

- Title (required).
- Description.
- Project.
- Dynamic Kanban column.
- Assignees.
- Due date.
- Priority (`Low`, `Medium`, `High`, `Urgent`).
- Tags.
- Epic.
- Estimated hours.
- Parent task for subtasks.
- Comments, attachments, activity logs, and time logs.

Task workflow state shall be represented by `columnId` and the related
KanbanColumn. The system shall not store a separate task status string.

### 3.3 Validation Rules

The system shall validate:

- Required task title.
- Valid UUID identifiers.
- Valid due dates.
- Priority from the allowed values.
- Assignments only to users who belong to the selected project.
- Column IDs only from the selected project.

### 3.4 Permissions

Project Managers may create, update, assign, and delete tasks in their projects.
Collaborators may view accessible tasks, update permitted workflow state, add
comments, upload/download attachments, and log time according to task access.

---

## 4. Real-Time Features

The system shall use Socket.IO for authenticated real-time updates.

Users shall receive notifications for:

- Task assignments.
- Column changes.
- Comments.
- Mentions.
- Approaching deadlines.
- Administrative updates.

Notifications shall be user-specific, persisted for offline users, and replayed
when the user reconnects. Socket rooms shall be scoped by user and conversation,
and users shall not be able to subscribe to unauthorized rooms.

The system shall support project chat rooms and direct messages scoped to shared
workspaces.

---

## 5. Validation and Error Handling

The system shall validate request bodies with backend Zod schemas. Frontend forms
shall provide immediate feedback, but backend validation is the final authority.

API errors shall use standard HTTP status codes and structured responses:

```json
{
  "errorCode": 400,
  "message": "Validation failed",
  "errors": {
    "field": "Reason"
  }
}
```

Controllers shall return validation, authorization, and not-found errors in a
consistent user-friendly shape.

---

## 6. Security Requirements

The system shall:

- Use Prisma ORM and parameterized database access.
- Treat entity identifiers as opaque UUID strings.
- Never numeric-coerce entity IDs.
- Use bcrypt for password hashes.
- Store JWTs in HTTP-only cookies for browser clients.
- Use HTTPS/TLS in deployed environments.
- Use Helmet security headers.
- Use CORS with explicit allowed frontend origin.
- Rate-limit login and account-action endpoints.
- Sanitize request input.
- Store invitation and OTP secrets only as hashes.
- Enforce object-level authorization for workspaces, projects, tasks, and task
  sub-resources.
- Keep secrets out of source control.

---

## 7. Architecture and Deployment

The backend follows a layered MVC structure:

- `routes/` for Express route definitions and OpenAPI annotations.
- `controllers/` for request handling and business logic orchestration.
- `services/` for cross-cutting concerns such as email, storage, sockets, and
  notifications.
- `middleware/` for auth, authorization, validation, upload, and error handling.
- `validations/` for Zod schemas.
- `prisma/` for database schema.

The frontend is a React + Vite single-page application with contexts for auth,
projects/workspaces, sockets, chat, theme, and toasts. It shall provide a
workspace app shell for tenant project work and a separate `/platform` console
shell for SaaS administration and support.

Deployment shall use Docker containers and cloud hosting. Kubernetes manifests
and GitHub Actions support AKS-style delivery.

---

## 8. Testing, Git, and Documentation

Before opening a pull request:

- Changed backend files shall pass `node --check`.
- Prisma schema shall pass `npx prisma validate`.
- Frontend shall build with `npm run build`.
- New or changed endpoints shall have Zod schemas and OpenAPI annotations.
- Behavior changes shall be documented in `docs/` and, where significant, in an
  ADR.

Git workflow:

- Work on feature branches.
- Open pull requests against protected `main`.
- Use Conventional Commits.
- Keep commits atomic by logical change.

---

## 9. Deliverables

Deliverables include:

- Source code.
- API documentation through Swagger/OpenAPI.
- Database schema/design.
- Architecture documentation and ADRs.
- Deployment manifests.
- Hosted frontend and backend demo URLs.
- README setup and usage instructions.

---

## 10. Grading Criteria Alignment

| Category | Implementation Coverage |
| --- | --- |
| Frontend | React SPA with workspace/project/task/chat/admin views |
| Backend | Express MVC API with Prisma, validation, auth, and services |
| Database | PostgreSQL schema with tenant, project, task, notification, chat, and OTP models |
| Security | JWT, bcrypt, rate limits, hashed OTP/invite tokens, object authorization |
| Real-Time Notifications | Socket.IO notifications, task updates, chat rooms, offline replay |
| DevOps and Deployment | Docker, Kubernetes manifests, Nginx config, cloud-ready env config |
| Documentation | Architecture docs, ADRs, SRS, Swagger/OpenAPI |
