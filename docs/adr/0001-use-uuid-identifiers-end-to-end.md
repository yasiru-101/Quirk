# 1. Use UUID string identifiers end-to-end

- Status: Accepted
- Date: 2026-06-23

## Context

The database schema uses UUID primary keys (`@id @default(uuid())`) for every
model. UUIDs are opaque strings such as `4f9c1e2a-...`.

Several layers of the application were carried over from an earlier revision that
used integer primary keys and coerced identifiers with `parseInt(id, 10)` before
querying. Against UUID keys, `parseInt` returns `NaN`, so the affected lookups
silently matched no rows:

- `middleware/auth.js` — token verification looked up the user by `parseInt(id)`,
  so every authenticated request failed with `401` after a successful login.
- `config/socket.js` — the WebSocket handshake resolved the user the same way, so
  no realtime connection could be established.
- `services/notificationService.js` — recipient and task identifiers were parsed,
  so notification rows failed to insert.
- `utils/userHelpers.js` — the "last active administrator" safeguard compared a
  `NaN` against a UUID, so the guard never triggered.

Because the frontend fell back to a local mock session whenever the backend
misbehaved, the application appeared to work while nothing persisted.

## Decision

Treat identifiers as opaque UUID strings everywhere. Never numeric-coerce an
entity id. The JWT subject is the user's UUID and is passed to the data layer
unchanged. Pagination and other genuinely numeric query parameters continue to be
parsed with `parseInt` — that is unrelated to entity identity.

## Consequences

- Authentication, authorization, realtime handshakes, and notifications operate
  against the real database.
- The client-side mock session fallback is removed so backend failures surface
  immediately instead of being masked.
- Any future model must keep UUID string keys; introducing an integer key would
  reintroduce this class of bug.
