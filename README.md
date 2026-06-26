# Quirk — Task Management System

Quirk is a multi-tenant, Jira-inspired task-management SaaS for teams that need to
plan, assign, discuss, and track work across multiple organizations. Each
workspace is an isolated tenant; users can belong to several workspaces with
different roles. It provides dynamic Kanban workflows, multiple task views,
real-time notifications and chat, a SaaS platform console, and an optional in-app
AI assistant.

## 🔗 Live demo

| Surface | URL |
| --- | --- |
| Frontend (SPA) | https://quirk-app.ddns.net |
| Backend API | https://quirk-app.ddns.net/api |
| API docs (Swagger UI) | https://quirk-app.ddns.net/api-docs |

## ✨ Features

- **Authentication** — self-service registration, email verification, login,
  password reset, and optional email-based two-factor authentication. Passwords
  are bcrypt-hashed; sessions use rotating JWTs in HTTP-only cookies.
- **Multi-tenant workspaces** — create workspaces, invite members by email,
  assign roles (`Admin`, `Project Manager`, `Collaborator`), and leave
  workspaces. Invitation tokens are stored only as hashes.
- **Projects** — dynamic Kanban columns, project members, epics, and per-project
  role management.
- **Tasks** — Kanban, list, calendar, and timeline views over one scoped query
  API; assignees, due dates, priorities, tags, subtasks, comments, attachments,
  activity logs, and time logs.
- **Real-time** — Socket.IO notifications (assignments, column changes, comments,
  mentions, deadlines) with offline replay, plus project chat and direct messages.
- **Platform console** — a separate `/platform` control plane for SaaS operators:
  overview metrics, tenant support, user administration, and audit review.
- **AI assistant** — an optional in-app assistant that lists and creates tasks
  through RBAC-safe tools, with automatic provider fallback. See
  [docs/AI_ASSISTANT.md](docs/AI_ASSISTANT.md).

## 🚀 Architecture overview

- **Frontend**: React 18, React Router, Vite, Tailwind CSS (v4).
- **Backend**: Node.js, Express 5, Prisma ORM.
- **Database**: PostgreSQL (via Prisma).
- **Real-time**: Socket.io for live updates.
- **AI assistant**: Google Gemini with Groq fallback (optional).
- **CI/CD**: Docker, Kubernetes (AKS), GitHub Actions.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the decision records in
[docs/adr/](docs/adr/README.md) for the design rationale.

## 📁 Repository structure

```
.
├── backend/                  # Express server & APIs
│   ├── config/               # DB, Socket.IO, Swagger, Azure clients
│   ├── controllers/          # Request handling and business logic
│   ├── middleware/           # Auth, RBAC, validation, uploads, errors
│   ├── prisma/               # Prisma schema
│   ├── routes/               # API routes + OpenAPI annotations
│   ├── services/             # Email, storage, notifications, sockets, AI
│   └── validations/          # Zod request schemas
│
├── frontend/                 # React UI
│   └── src/
│       ├── components/        # tasks, chat, layout, common, notifications
│       ├── context/           # Auth, Project, Socket, Chat, Theme, Toast
│       ├── pages/             # Route views (dashboard, projects, tasks, platform)
│       └── services/          # Axios API clients
│
├── docs/                     # Architecture, ADRs, security, API, AI assistant
├── k8s/                      # Kubernetes deployment configs
└── .github/workflows/        # CI/CD pipelines
```

## 🛠️ Local development

### Prerequisites
- Node.js 18+
- A PostgreSQL instance (local or Dockerized — see `docker-compose.yml`)

### Backend setup
```bash
cd backend
npm install
cp .env.example .env        # set DATABASE_URL + JWT secrets (and optional keys)
npx prisma db push          # apply the schema to your database
npm run seed                # optional: seed demo data
npm run dev                 # http://localhost:5000
```

### Frontend setup
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (Vite)
```

### Environment variables
All backend configuration is documented in [`backend/.env.example`](backend/.env.example).
`JWT_SECRET` and `JWT_REFRESH_SECRET` are required (the server refuses to start
without them). Azure email/storage and the AI provider keys are optional — the app
runs without them, falling back to local/development behavior.

## 📚 API documentation

With the backend running, interactive Swagger UI is served at:

```
http://localhost:5000/api-docs
```

The OpenAPI spec is generated from `@openapi` annotations on the route handlers.
For an overview of endpoint groups, auth, and the error format, see
[docs/API.md](docs/API.md).

## 📖 Documentation map

| Document | What it covers |
| --- | --- |
| [docs/DELIVERABLES.md](docs/DELIVERABLES.md) | Index of SRS deliverables and where each lives |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and request lifecycle |
| [docs/adr/](docs/adr/README.md) | Architecture Decision Records |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, ERD, and data-model design |
| [docs/API.md](docs/API.md) | API reference and Swagger entry point |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, Kubernetes, CI/CD, and demo URLs |
| [docs/SECURITY.md](docs/SECURITY.md) | Security posture and OWASP alignment |
| [docs/AI_ASSISTANT.md](docs/AI_ASSISTANT.md) | AI assistant design, tools, and config |
| [AGENTS.md](AGENTS.md) | Contributor working agreement |
| [Task_Management_SRS.md](Task_Management_SRS.md) | Software Requirements Specification |

## 🤝 Contributing

We use **feature branching** and **Conventional Commits**. Before opening a PR
against `main`:

- `node --check` passes on changed backend files; `npx prisma validate` passes.
- The backend starts and `GET /api/health` returns `200`.
- New or changed endpoints have a Zod schema **and** an OpenAPI annotation.
- Behavior changes are reflected in `docs/` (and an ADR where significant).

See [AGENTS.md](AGENTS.md) for the full working agreement, including the hard
rules (UUID identifiers, object-level authorization, Zod validation).

## 🚢 Deployment

Merging to `main` triggers the GitHub Actions pipeline
([`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)), which validates the
code, syncs the Prisma schema to Azure PostgreSQL, builds and pushes Docker images
to ACR, and deploys to Azure Kubernetes Service (AKS). Manifests live in
[`k8s/`](k8s/). For the full topology, manifest inventory, secrets, and a manual
deploy reference, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
