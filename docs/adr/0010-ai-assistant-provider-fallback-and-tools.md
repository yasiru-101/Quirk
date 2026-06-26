# 10. AI assistant with provider fallback and RBAC-safe tools

## Status

Accepted

## Context

Quirk includes an in-app AI assistant that can answer questions about a user's
work and take actions on their behalf (listing and creating tasks). Building this
raised three concerns:

- **Reliability.** A single hosted LLM provider is a single point of failure.
  Free and low-tier API keys are frequently rate-limited or temporarily
  unavailable, which would make the assistant fail intermittently.
- **Authorization.** An assistant that can read and create tasks must not become
  a way around the object-level authorization that the REST API enforces. A model
  that "decides" to read another tenant's tasks must still be stopped by the same
  membership checks.
- **Provider lock-in.** Each provider (Gemini, Groq, …) expects tool/function
  schemas and message history in its own shape. Spreading that shape through the
  controller would couple the feature to one vendor.

## Decision

The assistant lives in `backend/services/ai/` and is exposed through a single
authenticated endpoint, `POST /api/ai/chat`.

**Provider fallback.** An orchestrator (`services/ai/index.js`) holds an ordered
list of provider adapters — Gemini first, then Groq. It runs only the providers
that are configured (have an API key) and, when a provider fails with a
transient/quota/transport error, automatically falls back to the next one. The
response reports which `provider` actually answered. If no provider is configured
the endpoint returns `503` and the rest of the app is unaffected.

**Provider-agnostic tools.** Tool *schemas* are declared once in neutral
JSON-Schema form in `services/ai/tools.js`; each adapter translates them to its
own format (Gemini uppercases types; Groq uses the OpenAI function shape). Tool
*execution* happens in one shared place, so the same logic runs regardless of
which model requested the call.

**RBAC-safe execution.** Every tool re-applies the same authorization as the REST
API rather than trusting the model or the request:

- The controller first verifies the caller belongs to the `projectId` /
  `workspaceId` context via `resolveProjectAccess` / workspace membership.
- `get_tasks` applies the same row-level scoping as `GET /api/tasks` — a caller
  only sees tasks they created, are assigned to, are a project member of, or
  administer the workspace of.
- `create_task` calls `resolveProjectAccess(..., ['Project Manager'])`, so a
  Collaborator is denied exactly as they would be at the REST endpoint.

Tools return structured errors and permission denials (they do not throw), and
the system prompt instructs the model to relay those plainly instead of pretending
an action succeeded.

**Bounded context.** Conversation history is sanitized and truncated to the most
recent turns to bound token usage, and the per-message content length is capped.

## Consequences

- The assistant degrades gracefully: a rate-limited primary provider transparently
  falls back to the secondary one.
- Adding a new provider means writing one adapter that implements
  `isConfigured()` and `chat()`; no controller or tool changes are needed.
- The assistant cannot exceed the caller's own permissions, because tool execution
  reuses the same membership guards as the REST API. See
  [ADR 0002](./0002-workspace-tenancy-and-scoped-authorization.md) and
  [ADR 0004](./0004-task-level-object-authorization.md).
- Provider API keys are optional configuration; the feature is fully disablable by
  leaving them unset.
