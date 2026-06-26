# Security

This document describes the security posture of the system and the controls that
enforce it. It is maintained alongside the code; changes that affect security are
reflected here.

## Secret management

No secret is stored in the repository.

- `.env` is git-ignored and has never been committed (verified against full git
  history). Application secrets live only in:
  - **Local development:** each developer's own `.env` (not tracked).
  - **Production:** the Kubernetes `quirk-secrets` secret, created imperatively
    (`kubectl create secret`), and GitHub Actions repository secrets
    (`AZURE_CREDENTIALS`, `DATABASE_URL`, `VITE_API_URL`).
- `k8s/secret.yaml` is a template containing placeholders only; it is never applied
  to the cluster, and the deploy pipeline does not touch the live secret.
- The server refuses to start without `JWT_SECRET` and `JWT_REFRESH_SECRET` set
  (fail-fast in `server.js`), so a misconfigured deploy cannot run with weak keys.
- No credential is hardcoded in source. Demo quick-login helpers render only in
  development builds (`import.meta.env.DEV`) and never ship to production.

## Transport security

- All production HTTP is served over TLS; HSTS is enforced for one year including
  subdomains (Helmet). Certificates are provisioned automatically by cert-manager
  via the ingress issuer.
- WebSocket connections use WSS in production.
- The database connection uses TLS with **certificate verification enabled**
  (`rejectUnauthorized: true`), preventing man-in-the-middle attacks on database
  traffic. See `backend/config/db.js`.

## Authentication & sessions

- Passwords are hashed with bcrypt (cost factor 12); plaintext is never stored.
- Access (15 min) and refresh (7 days) tokens are issued as `httpOnly`,
  `sameSite=strict` cookies; refresh rotates both tokens.
- Administrator-created accounts must reset their temporary password on first login
  before any other route is reachable. Workspace invitations to a new email
  provision an account the same way: the temporary password is bcrypt-hashed at
  rest and the emailed set-password link carries only a high-entropy invitation
  token (SHA-256–hashed in the database, single-use, 7-day expiry). The
  set-password route only acts while the account still owes a reset and bumps the
  session cutoff, so a leaked token cannot take over an already-activated account.
- Users manage their own profile from Settings: updating the display name
  (`PATCH /auth/profile`) and changing their password (`POST /auth/reset-password`,
  which verifies the current password and rotates session tokens, evicting other
  sessions). Email changes and role assignment remain administrator-controlled.
- Self-service registrations must verify their email before they can sign in, and may
  enable email-based login 2FA. Forgot-password uses the same one-time-code
  primitive with the `PASSWORD_RESET` purpose. One-time codes are bcrypt-hashed
  at rest, single-use, expire in 10 minutes, lock after 5 failed attempts, and
  are purged after consumption or expiry; the 2FA step is bound to the password
  step by a short-lived signed pending token. See
  [ADR 0003](./adr/0003-registration-email-verification-and-2fa.md).

## Authorization

- Platform support access is represented by `User.isPlatformAdmin`; ordinary
  tenant roles are scoped to `WorkspaceMember.role` and `ProjectMember.role`.
  There is no global product role on `User`.
- Object-level membership checks (`requireWorkspaceRole`, `requireProjectRole`,
  and `requireTaskAccess`) ensure a user can only act on workspaces, projects,
  tasks, attachments, comments, activity, and time logs they are allowed to see.
  See
  [ADR 0002](./adr/0002-workspace-tenancy-and-scoped-authorization.md).

## AI assistant

- The AI assistant (`POST /api/ai/chat`) cannot exceed the caller's own
  permissions. The controller verifies workspace/project membership before any
  model call, and every tool re-applies the same object-level authorization as the
  REST API: `get_tasks` uses the same row-level scoping as `GET /api/tasks`, and
  `create_task` re-checks Project Manager access. A model "deciding" to act has no
  more power than the user it acts for.
- Tools return structured errors and permission denials rather than throwing, and
  the system prompt forbids claiming success when a tool reported an error.
- Conversation history is sanitized and truncated, and message content is
  length-capped, to bound token usage.
- Provider API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) are optional environment
  variables and are never committed. See
  [ADR 0010](./adr/0010-ai-assistant-provider-fallback-and-tools.md).

## Input handling

- Every request body is validated with a Zod schema before it reaches a controller.
- All database access goes through Prisma's parameterized queries; no string-built
  SQL, eliminating SQL injection.
- Local development attachment URLs under `/uploads` are protected by the same
  task access guard before static files are served. In production, attachments
  use Azure Blob Storage and clients receive short-lived read URLs from the
  attachment API instead of relying on raw blob URLs.
- JSON and URL-encoded bodies are size-limited (10 kb) to resist oversized-payload
  abuse.
- Rate limiting is applied to the API (100 requests / 15 min per IP) with
  stricter limits on login (10 / 15 min) and account-code actions such as
  registration, email verification, 2FA, forgot-password, and reset-password OTP
  (12 / 15 min). The health endpoint is intentionally exempt so liveness probes
  are never throttled.

## OWASP Top 10 alignment

| Risk | Control |
| --- | --- |
| Broken access control | Role + object-level membership authorization |
| Cryptographic failures | bcrypt password hashing; TLS with cert verification |
| Injection | Prisma parameterized queries; Zod validation |
| Security misconfiguration | Helmet headers, HSTS, fail-fast on missing secrets |
| Identification & auth failures | Short-lived rotated JWTs, login rate limiting |
| Vulnerable components | Dependencies pinned via lockfiles |
| SSRF / excessive agency (AI) | AI tools re-apply REST object-level authorization; no cross-tenant access |
