# Working agreement for contributors

This file is the shared brief for anyone — human or AI assistant — contributing to
Quirk. Read it before making changes.

## What this project is

Quirk is a multi-tenant task-management SaaS (a Jira/Asana-style product).

- `backend/` — Node.js + Express + Prisma, PostgreSQL, Socket.IO.
- `frontend/` — React + Vite + Tailwind.
- `docs/` — architecture notes and decision records (read these first).
- `k8s/`, `.github/workflows/` — Docker + AKS delivery.

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and the ADRs in
[`docs/adr/`](docs/adr). They explain the decisions you must not silently undo.

## Hard rules

1. **Identifiers are UUID strings.** Never `parseInt` an entity id. See ADR 0001.
2. **Authorize at the object level.** A role check is not enough; verify the user
   belongs to the workspace/project they are acting on. Use the guards in
   `backend/middleware/membership.js`. See ADR 0002.
3. **Validate every request body** with a Zod schema in `backend/validations/`,
   applied through the `validate` middleware.
4. **Comments describe the code, plainly.** No attribution to tools, assistants,
   or models anywhere in code, comments, or commit messages.
5. **Keep secrets out of the repo.** Use `.env` (see `.env.example`).

## Conventions

- **Branches:** one logical change per branch, named `feat/...`, `fix/...`,
  `chore/...`, `refactor/...`.
- **Commits:** Conventional Commits (`feat(scope): summary`). No attribution
  trailers.
- **PRs:** open against `main`; merge with a merge commit.
- **Style:** match the surrounding file. Controllers return
  `{ errorCode, message, errors? }` on failure via the central error handler.
- **Docs:** when you change behaviour, update `docs/` in the same change. A
  decision worth defending gets a new ADR (`docs/adr/NNNN-title.md`).

## Local development

```
# Backend
cd backend && npm install
cp .env.example .env        # set DATABASE_URL + JWT secrets
npx prisma db push          # apply the schema to your database
npm run dev                 # http://localhost:5000

# Frontend
cd frontend && npm install
npm run dev                 # http://localhost:5173
```

API docs are served at `/api-docs` (Swagger UI) when the backend is running.

## Before you open a PR

- `node --check` passes on changed backend files; `npx prisma validate` passes.
- The backend starts and `GET /api/health` returns `200`.
- New endpoints have an OpenAPI annotation and a Zod schema.
- You updated the relevant doc/ADR.

## Foundation status

The core platform is being built in slices. Build features on top of these, not
around them:

- [x] UUID identifier consistency (ADR 0001)
- [x] Workspace tenancy, membership roles, invitations, scoped authorization (ADR 0002)
- [x] Self-service registration, email verification, login 2FA (ADR 0003)
- [x] Task-level object authorization (ADR 0004)
- [x] Kanban column as the single source of task status (ADR 0006)
- [x] Separate platform support console (ADR 0009)
- [x] AI assistant with provider fallback and RBAC-safe tools (ADR 0010)

Feature work that sits cleanly on the current foundation: workspace/project UI,
the realtime chat/DM module (reuse the Socket.IO room pattern in
`backend/config/socket.js`), and the calendar/timeline views (consume the task
query API, do not add per-view endpoints).
