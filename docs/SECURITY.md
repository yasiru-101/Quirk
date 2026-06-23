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
  before any other route is reachable.
- Self-service registrations must verify their email before they can sign in, and may
  enable email-based login 2FA. One-time codes are bcrypt-hashed at rest, single-use,
  expire in 10 minutes, and lock after 5 failed attempts; the 2FA step is bound to the
  password step by a short-lived signed pending token. See
  [ADR 0003](./adr/0003-registration-email-verification-and-2fa.md).

## Authorization

- Coarse role checks (`rbac`) plus object-level membership checks
  (`requireWorkspaceRole` / `requireProjectRole`) ensure a user can only act on
  workspaces and projects they belong to. See
  [ADR 0002](./adr/0002-workspace-tenancy-and-scoped-authorization.md).

## Input handling

- Every request body is validated with a Zod schema before it reaches a controller.
- All database access goes through Prisma's parameterized queries; no string-built
  SQL, eliminating SQL injection.
- JSON and URL-encoded bodies are size-limited (10 kb) to resist oversized-payload
  abuse.
- Rate limiting is applied to the API (100 requests / 15 min per IP) with a stricter
  limit on the login route (10 / 15 min) to resist brute force. The health endpoint
  is intentionally exempt so liveness probes are never throttled.

## OWASP Top 10 alignment

| Risk | Control |
| --- | --- |
| Broken access control | Role + object-level membership authorization |
| Cryptographic failures | bcrypt password hashing; TLS with cert verification |
| Injection | Prisma parameterized queries; Zod validation |
| Security misconfiguration | Helmet headers, HSTS, fail-fast on missing secrets |
| Identification & auth failures | Short-lived rotated JWTs, login rate limiting |
| Vulnerable components | Dependencies pinned via lockfiles |
