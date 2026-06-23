# Architecture

This document describes how the Quirk Task Management System is put together. It
is kept current as the system evolves; significant decisions are recorded as ADRs
under [`docs/adr`](./adr).

## Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React, Vite, Tailwind CSS, React Router           |
| Backend   | Node.js, Express, Prisma ORM                      |
| Database  | PostgreSQL                                        |
| Realtime  | Socket.IO                                         |
| Email     | Azure Communication Services (Ethereal in dev)    |
| Storage   | Azure Blob Storage (local disk in dev)            |
| Delivery  | Docker, Kubernetes (AKS), GitHub Actions          |

## Backend layout

The backend follows a layered MVC structure:

```
backend/
  routes/        HTTP route definitions and OpenAPI annotations
  controllers/   Request handling and business logic
  services/      Cross-cutting concerns (email, notifications, sockets, storage)
  middleware/    Auth, RBAC, validation, error handling, uploads
  validations/   Zod request schemas
  utils/         Shared helpers (activity logging, password/user helpers)
  config/        Database, Socket.IO, Swagger, Azure clients
  prisma/        Schema and migrations
```

### Request lifecycle

1. Security middleware runs first: Helmet headers, CORS, body-size limits, input
   sanitisation, and rate limiting (a stricter limiter guards the login route).
2. `protect` authenticates the request from the `accessToken` cookie (or a Bearer
   token), loads the user, and enforces the mandatory-password-reset gate.
3. `rbac(...roles)` authorises the request against the user's role.
4. A Zod schema validates the request body via the `validate` middleware.
5. The controller executes the business logic through Prisma.
6. Any thrown error is normalised by the central error handler into a consistent
   `{ errorCode, message, errors }` payload.

### Identifiers

All entity identifiers are opaque UUID strings and are never numerically coerced.
See [ADR 0001](./adr/0001-use-uuid-identifiers-end-to-end.md).

## Authorization

Two layers work together:

1. **Role guard** (`middleware/rbac.js`) — coarse checks against the global
   `User.role`. Used for platform-level user administration under `/users`.
2. **Membership guards** (`middleware/membership.js`) — object-level checks that
   resolve the caller's membership of the workspace or project in the request:
   - `requireWorkspaceRole(...roles)` for `/workspaces/:id/...`
   - `requireProjectRole(...roles)` for `/projects/:id/...`
   - `requireTaskAccess(...roles)` for tasks and their sub-resources (comments,
     time logs, activity, attachments), resolving the task's project membership

Membership roles are scoped, not global:

| Scope     | Roles                                |
| --------- | ------------------------------------ |
| Workspace | `Owner`, `Admin`, `Member`           |
| Project   | `Project Manager`, `Collaborator`    |
| Platform  | `Admin` (system-wide administration) |

A platform `Admin` bypasses membership checks. Workspace Owners/Admins implicitly
have access to projects within their workspace. See
[ADR 0002](./adr/0002-workspace-tenancy-and-scoped-authorization.md).

## Authentication and sessions

- Passwords are hashed with bcrypt (cost factor 12).
- On login the server issues a short-lived access token (15 min) and a longer
  refresh token (7 days), both stored as `httpOnly` cookies.
- `POST /auth/refresh` rotates both tokens.
- Accounts created by an administrator start with `mustResetPassword = true`; the
  user is forced to set a new password on first login before any other route is
  reachable.
- Self-service registration creates an unverified account and emails a one-time
  code; login is blocked until the email is verified. Users may optionally enable
  email-based login 2FA. Both flows use the shared one-time-code primitive (bcrypt
  hashed, single-use, time- and attempt-limited). See
  [ADR 0003](./adr/0003-registration-email-verification-and-2fa.md).

## Realtime

Socket.IO authenticates each connection during the handshake using the same JWT
as the REST API. Each user joins a private room (`user:<id>`); notifications are
emitted to that room. Notifications created while a user is offline are persisted
and replayed when they reconnect.

Each conversation also has a room (`conv:<id>`). On connection the server resolves
all conversations the user participates in and joins those rooms. Incoming chat
messages are emitted to the conversation room so all connected participants receive
them immediately. The latest message preview per conversation is replayed on
reconnect. See [ADR 0003](./adr/0003-realtime-chat-and-dm-module.md).

## Frontend layout

The frontend is a React + Vite single-page application:

```
frontend/src/
  pages/          Full-page route components (TaskBoardPage, DashboardPage, …)
  components/
    tasks/        Task-specific views: KanbanBoard, TaskTable,
                  TaskCalendarView, TaskTimelineView, TaskModal, TaskCard, …
    common/       Shared primitives (Button, Modal, Input, ViewHeader, …)
    layout/       AppLayout, Sidebar, TopBar
    chat/         Chat and DM components
    notifications/ NotificationPanel
  context/        React contexts (Auth, Socket, Toast, Theme, Project, Chat)
  services/       Axios wrappers for backend API (taskService, userService, …)
  utils/          helpers.js (formatting, colours), constants.js
  index.css       Design-system tokens (Quirk Mint & Ink) + Tailwind v4
```

### Task Board views

`TaskBoardPage` fetches the scoped task list once on mount and passes the
`filtered` array down to whichever view is active. Four view modes are supported,
selected via the `ViewHeader` tab strip:

| Tab | Component | Data source |
| --- | --- | --- |
| Board | `KanbanBoard` | Grouped by `columnId` |
| List | `TaskTable` | Flat sorted list |
| Calendar | `TaskCalendarView` | Mapped to `dueDate` in a month grid |
| Timeline | `TaskTimelineView` | Gantt bars from `createdAt` → `dueDate` |

Calendar and Timeline views add no new API endpoints; they consume the same
task array already in memory. See
[ADR 0005](./adr/0005-calendar-and-timeline-views-consume-task-query-api.md).

## Roadmap

The system is being expanded from a single-tenant tool into a multi-tenant SaaS
product. Status of the foundational work:

- [x] Workspace tenancy with invitation-based onboarding.
- [x] Per-workspace and per-project membership roles with object-level
  authorization on workspace and project resources.
- [x] Task-level object authorization (resolve a task's project membership).
- [x] Self-service registration with email verification and optional login 2FA.
- [x] Calendar and Timeline (Gantt) views for the task board.
- [x] Kanban column as the single source of task workflow state.

Each item ships as an isolated, reviewable change with its own migration, tests,
and documentation update.
