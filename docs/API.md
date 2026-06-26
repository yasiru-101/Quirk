# API Reference

The Quirk backend exposes a REST API under the `/api` prefix. The full,
interactive contract for every endpoint is generated from in-code OpenAPI
annotations and served by Swagger UI.

## Interactive docs (Swagger / OpenAPI)

With the backend running:

```
http://localhost:5000/api-docs
```

The spec is built with `swagger-jsdoc` from `@openapi` annotations on the route
handlers (`backend/routes/*.js`) and is configured in `backend/config/swagger.js`.
Every new or changed endpoint must carry an OpenAPI annotation and a Zod request
schema (see [AGENTS.md](../AGENTS.md)).

## Authentication

Browser clients authenticate with an `accessToken` HTTP-only cookie set at login;
a `refreshToken` cookie rotates the session via `POST /api/auth/refresh`. In
Swagger this is the `cookieAuth` security scheme. Protected endpoints return `401`
when the session is missing or expired.

## Endpoint groups

| Base path | Area | Notes |
| --- | --- | --- |
| `/api/auth` | Registration, email verification, login, 2FA, refresh, forgot/reset password, self-service profile (`PATCH /auth/profile`) | Login and account-code actions are rate-limited |
| `/api/users` | Platform user management (create, list, update, deactivate) | Platform admins only |
| `/api/tasks` | Tasks plus nested comments (`/:taskId/comments`), activity (`/:id/activity`), and time logs (`/:id/timelogs`) | Object-level task authorization |
| `/api/attachments` | Task attachments | Access checked against owning task |
| `/api/notifications` | User notifications | |
| `/api/projects` | Projects, Kanban columns, epics, project members | |
| `/api/workspaces` | Workspaces, members, invitations | Tenant boundary |
| `/api/chat` | Conversations and messages | |
| `/api/search` | Global search | |
| `/api/platform` | SaaS platform console | Platform admins only |
| `/api/ai` | AI assistant chat | See [AI_ASSISTANT.md](./AI_ASSISTANT.md) |
| `/api/health` | Liveness/readiness probe | Unauthenticated, rate-limit exempt |

## Conventions

- **Identifiers** are opaque UUID strings and are never numerically coerced
  ([ADR 0001](./adr/0001-use-uuid-identifiers-end-to-end.md)).
- **Validation** — every request body is validated by a Zod schema in
  `backend/validations/` before it reaches a controller.
- **Authorization** is enforced at the object level, not by role alone
  ([ADR 0002](./adr/0002-workspace-tenancy-and-scoped-authorization.md)).
- **Role model** uses `User.isPlatformAdmin` for platform support and membership
  rows (`WorkspaceMember.role`, `ProjectMember.role`) for tenant/project access.
  There is no global product role on `User`.

## Error format

Errors use standard HTTP status codes and a consistent JSON shape produced by the
central error handler:

```json
{
  "errorCode": 400,
  "message": "Validation failed",
  "errors": {
    "field": "Reason"
  }
}
```

The `errors` map is present for field-level validation failures and omitted for
single-message errors (authorization, not-found, etc.).
