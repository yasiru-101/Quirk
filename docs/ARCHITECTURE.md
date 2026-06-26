# Architecture

This document describes how Quirk is put together. Significant decisions are
recorded as ADRs under [`docs/adr`](./adr). Visual models (class, deployment,
architecture, sequence, and use-case diagrams) are in [DIAGRAMS.md](./DIAGRAMS.md).

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Realtime | Socket.IO |
| Email | Azure Communication Services, Ethereal in development |
| Storage | Azure Blob Storage, local disk in development |
| AI assistant | Google Gemini with Groq fallback (optional) |
| Delivery | Docker, Kubernetes, GitHub Actions |

## Backend Layout

The backend follows a layered MVC structure:

```text
backend/
  routes/        HTTP route definitions and OpenAPI annotations
  controllers/   Request handling and business logic
  services/      Cross-cutting concerns such as email, notifications, sockets, storage
  middleware/    Auth, authorization, validation, error handling, uploads
  validations/   Zod request schemas
  utils/         Shared helpers
  config/        Database, Socket.IO, Swagger, Azure clients
  prisma/        Schema
```

## Request Lifecycle

1. Security middleware runs first: Helmet headers, CORS, body-size limits, input
   sanitization, and rate limiting.
2. `protect` authenticates the request from the `accessToken` cookie or Bearer
   token, loads the user, and enforces the mandatory-password-reset gate.
3. Platform-only routes use `requirePlatformAdmin`.
4. Tenant routes use object-level membership guards:
   `requireWorkspaceRole`, `requireProjectRole`, or `requireTaskAccess`.
5. A Zod schema validates the request body through `validate`.
6. The controller executes business logic through Prisma.
7. The central error handler normalizes errors into a consistent payload.

## Identifiers

All entity identifiers are opaque UUID strings and are never numerically coerced.
Pagination and other numeric query parameters may be parsed as numbers, but
entity IDs must remain strings. See
[ADR 0001](./adr/0001-use-uuid-identifiers-end-to-end.md).

## Multi-Tenant Authorization

Quirk has three authorization scopes:

| Scope | Representation | Purpose |
| --- | --- | --- |
| Platform | `User.isPlatformAdmin` | SaaS-wide support and user administration |
| Workspace | `WorkspaceMember.role` | Tenant membership and workspace management |
| Project | `ProjectMember.role` | Project execution and task control |

Workspace roles follow the SRS model:

- `Admin`
- `Project Manager`
- `Collaborator`

Project roles are:

- `Project Manager`
- `Collaborator`

Platform administrator access is intentionally separate from tenant roles. A
workspace `Admin` is not automatically a platform administrator, and a platform
administrator does not need a special tenant role to perform support operations.
The platform console is a separate SaaS control plane for operations and
support, not another tenant workspace task board.

Legacy `Owner` workspace membership rows are treated as workspace admins for
backward compatibility, but new workspaces and invitations use `Admin`,
`Project Manager`, and `Collaborator`.

Object-level authorization is mandatory. A role check alone is not enough; the
backend must verify that the caller belongs to the workspace, project, or task
context being accessed. See
[ADR 0002](./adr/0002-workspace-tenancy-and-scoped-authorization.md),
[ADR 0004](./adr/0004-task-level-object-authorization.md),
[ADR 0008](./adr/0008-platform-admin-and-srs-tenant-roles.md), and
[ADR 0009](./adr/0009-separate-platform-support-console.md).

## Authentication and Sessions

- Passwords are hashed with bcrypt.
- Login issues a short-lived access token and a longer refresh token.
- Tokens are stored as HTTP-only cookies for browser clients.
- `POST /auth/refresh` rotates both tokens.
- Platform-created users receive a temporary password and must reset it on first
  login.
- Self-service registration creates an unverified account and emails a one-time
  code.
- Users may enable email-based login 2FA.
- Forgot-password uses the same one-time-code primitive.

See [ADR 0003](./adr/0003-registration-email-verification-and-2fa.md).

## Workspaces and Projects

A workspace is the tenant boundary. Users can belong to multiple workspaces with
different workspace roles.

Workspace Admins can invite members, change member roles, remove members, and
manage projects. Workspace Project Managers can create projects in workspaces
they belong to. Collaborators participate in accessible projects and tasks.

Users can leave workspaces themselves. The last workspace Admin cannot leave or
be removed until another Admin exists.

Projects belong to workspaces and contain dynamic Kanban columns. Project
Managers manage project members, columns, epics, and tasks.

## Task Workflow

Kanban columns are the single source of task workflow state. Tasks store
`columnId`, not a duplicate status string. Reads include the related column
metadata. Calendar and timeline views consume the same scoped task query API as
the board and list views. See
[ADR 0005](./adr/0005-calendar-and-timeline-views-consume-task-query-api.md) and
[ADR 0006](./adr/0006-kanban-column-as-task-workflow-state.md).

## Realtime

Socket.IO authenticates each connection during the handshake using the same JWT
as the REST API. Each user joins a private room (`user:<id>`). Notifications are
emitted to that room, persisted for offline users, and replayed on reconnect.

Each conversation also has a room (`conv:<id>`). On connection the server joins
the rooms for conversations the user participates in. See
[ADR 0003](./adr/0003-realtime-chat-and-dm-module.md).

## AI Assistant

An optional in-app assistant answers questions about a user's work and can list
or create tasks through tool calls. It is exposed at `POST /api/ai/chat` and
implemented in `backend/services/ai/`. Providers run in priority order — Gemini
first, then Groq — with automatic fallback when one is rate-limited or
unavailable. Tool execution re-applies the same object-level authorization as the
REST API, so the assistant can never exceed the caller's own permissions. The
feature is fully optional: with no provider API key set, the endpoint returns
`503` and nothing else is affected. See
[ADR 0010](./adr/0010-ai-assistant-provider-fallback-and-tools.md) and
[AI_ASSISTANT.md](./AI_ASSISTANT.md).

## API Documentation

OpenAPI annotations on the route handlers are compiled by `swagger-jsdoc` and
served as interactive Swagger UI at `/api-docs`. Every endpoint group is
documented there. See [API.md](./API.md).

## Frontend Layout

The frontend is a React + Vite single-page application:

```text
frontend/src/
  pages/          Full-page route components
  components/
    tasks/        Kanban, table, calendar, timeline, modal, cards
    common/       Shared primitives
    layout/       AppLayout, Sidebar, TopBar
    chat/         Chat and DM components
    notifications/ Notification panel and bell
  context/        Auth, Socket, Toast, Theme, Project, Chat
  services/       Axios wrappers for backend APIs
  utils/          Formatting, analytics, constants
  index.css       Design-system tokens and Tailwind
```

The workspace app shell and platform console shell are separate:

- The workspace app shell shows workspace switching, project navigation, task
  creation, chat, notifications, and tenant settings.
- The platform console shell is visible only to platform administrators and
  focuses on SaaS overview, tenant support, user management, and audit review.
  It intentionally omits workspace switching, task-board navigation, and tenant
  task creation.

Notable routes:

- `/dashboard` - operational overview.
- `/projects` and `/projects/:id` - workspace projects and project settings.
- `/tasks?projectId=<id>` - project-scoped task board.
- `/members` - workspace membership.
- `/chat` - workspace/project/direct messaging.
- `/platform` - platform support overview, visible only to platform
  administrators.
- `/platform/workspaces` - tenant workspace support list.
- `/platform/users` - platform user administration.
- `/platform/audit` - recent support audit feed.

## Roadmap Status

- [x] UUID identifier consistency.
- [x] Workspace tenancy and scoped authorization.
- [x] Platform administrator separation from tenant roles.
- [x] Separate platform support console.
- [x] Workspace invitations and self-service leave.
- [x] Self-service registration, email verification, login 2FA, and password
  reset.
- [x] Task-level object authorization.
- [x] Calendar and Timeline views consuming the task query API.
- [x] Kanban columns as task workflow state.
- [x] AI assistant with provider fallback and RBAC-safe tools (ADR 0010).
