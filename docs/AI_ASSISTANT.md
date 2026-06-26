# AI Assistant

Quirk ships an in-app AI assistant that answers questions about a user's work and
can take a small set of actions on their behalf. This document describes how it is
built, configured, and secured. The design rationale is recorded in
[ADR 0010](./adr/0010-ai-assistant-provider-fallback-and-tools.md).

## Where it lives

| Layer | Location |
| --- | --- |
| Endpoint | `POST /api/ai/chat` (`backend/routes/aiRoutes.js`) |
| Controller | `backend/controllers/aiController.js` |
| Orchestrator | `backend/services/ai/index.js` |
| Provider adapters | `backend/services/ai/geminiProvider.js`, `groqProvider.js` |
| Tools (schemas + execution) | `backend/services/ai/tools.js` |
| Frontend | `frontend/src/components/ui/ai-input.jsx`, mounted in `AppLayout.jsx` |

## Request / response

`POST /api/ai/chat` (authenticated):

```json
{
  "message": "What tasks are due this week?",
  "projectId": "1f2e...",          // or "workspaceId" when no project is open
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

```json
{
  "reply": "You have 3 tasks due this week: ...",
  "provider": "gemini"
}
```

The full request/response contract is published in Swagger UI at `/api-docs`
under the **AI Assistant** tag.

## Providers and fallback

Providers are tried in priority order with automatic fallback:

1. **Gemini** (`GEMINI_API_KEY`, default model `gemini-2.5-flash`)
2. **Groq** (`GROQ_API_KEY`, default model `llama-3.3-70b-versatile`)

Only configured providers run. When a provider fails with a transient, quota, or
transport error (HTTP 408/409/429/5xx, "rate limit", "quota", "overloaded",
network errors, …), the orchestrator falls back to the next configured provider.
The `provider` field in the response reports which one actually answered.

If **no** provider key is set, `POST /api/ai/chat` returns `503` and the rest of
the application is unaffected — the assistant is entirely optional.

## Tools

The assistant can call two tools. Schemas are declared once in neutral JSON-Schema
form and translated per provider; execution is shared so the same rules apply
regardless of which model called the tool.

| Tool | Purpose | Permission |
| --- | --- | --- |
| `get_tasks` | List tasks in the current project (or workspace), with optional status / priority / due-date filtering and sorting | Caller sees only tasks they could see via `GET /api/tasks` |
| `create_task` | Create a task in the current project | Requires Project Manager (or workspace Admin / platform admin) |

## Security model

The assistant cannot exceed the caller's own permissions:

- **Context guard.** The controller verifies the caller belongs to the requested
  `projectId` / `workspaceId` before any model call, returning `403` otherwise.
- **Object-level authorization in tools.** `get_tasks` re-applies the same
  row-level scoping as `GET /api/tasks`; `create_task` re-checks Project Manager
  access via `resolveProjectAccess`. A model "deciding" to act has no more power
  than the user it acts for.
- **Honest failures.** Tools return structured errors and permission denials
  instead of throwing, and the system prompt forbids claiming success when a tool
  reported an error.
- **Bounded input.** History is sanitized and truncated to the most recent turns;
  per-message content is length-capped to bound token usage.
- **Secrets.** Provider API keys live only in environment variables
  (`GEMINI_API_KEY`, `GROQ_API_KEY`) and are never committed. See
  [SECURITY.md](./SECURITY.md).

## Configuration

See `backend/.env.example`:

```bash
# Set at least one to enable the assistant.
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash        # optional override
GROQ_API_KEY=...                     # fallback provider
GROQ_MODEL=llama-3.3-70b-versatile   # optional override
```

## Adding a provider

Write an adapter exposing `name`, `isConfigured()`, and
`chat({ system, message, history, toolSpecs, executeTool, ctx })`, then add it to
the `PROVIDERS` list in `services/ai/index.js`. No controller or tool changes are
required.
