# Deliverables

This document maps each deliverable required by the
[SRS §9](../Task_Management_SRS.md) to its location in the repository, so the
submission can be checked at a glance.

| # | Deliverable (SRS §9) | Where it lives | Status |
| --- | --- | --- | --- |
| 1 | **Source code** | [`backend/`](../backend), [`frontend/`](../frontend) | ✅ |
| 2 | **API documentation (Swagger/OpenAPI)** | Live Swagger UI at `/api-docs`; generated from `@openapi` route annotations ([`backend/config/swagger.js`](../backend/config/swagger.js)); overview in [docs/API.md](./API.md) | ✅ |
| 3 | **Database schema / design** | Prisma schema [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma); design doc + ERD in [docs/DATABASE.md](./DATABASE.md) | ✅ |
| 4 | **Architecture documentation & ADRs** | [docs/ARCHITECTURE.md](./ARCHITECTURE.md); diagrams in [docs/DIAGRAMS.md](./DIAGRAMS.md); ADRs in [docs/adr/](./adr/README.md) | ✅ |
| 5 | **Deployment manifests** | [`k8s/`](../k8s), [`backend/Dockerfile`](../backend/Dockerfile), [`frontend/Dockerfile`](../frontend/Dockerfile), [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml); guide in [docs/DEPLOYMENT.md](./DEPLOYMENT.md) | ✅ |
| 6 | **Hosted frontend & backend demo URLs** | See below and [docs/DEPLOYMENT.md](./DEPLOYMENT.md) | ✅ |
| 7 | **README setup & usage instructions** | [README.md](../README.md) | ✅ |

The deployment evidence also includes the manual database reset workflow
[`.github/workflows/reset-db.yml`](../.github/workflows/reset-db.yml), used only
for explicit destructive Azure PostgreSQL resets followed by the minimal
platform-admin seed.

## Hosted demo URLs

| Surface | URL |
| --- | --- |
| Frontend (SPA) | https://quirk-app.ddns.net |
| Backend API | https://quirk-app.ddns.net/api |
| API docs (Swagger UI) | https://quirk-app.ddns.net/api-docs |

## Supporting documentation

Beyond the required deliverables, the following docs support evaluation and
maintenance:

| Document | Covers |
| --- | --- |
| [docs/SECURITY.md](./SECURITY.md) | Security posture and OWASP Top 10 alignment |
| [docs/AI_ASSISTANT.md](./AI_ASSISTANT.md) | AI assistant design, tools, and configuration |
| [AGENTS.md](../AGENTS.md) | Contributor working agreement and pre-PR checklist |
| [Task_Management_SRS.md](../Task_Management_SRS.md) | Software Requirements Specification |

## Grading-criteria coverage (SRS §10)

| Category | Evidence |
| --- | --- |
| Frontend | React SPA — [`frontend/src/pages`](../frontend/src/pages), workspace + `/platform` shells |
| Backend | Express MVC + Prisma — [`backend/`](../backend); layered routes/controllers/services/middleware/validations |
| Database | PostgreSQL via Prisma — [docs/DATABASE.md](./DATABASE.md) |
| Security | JWT, bcrypt, rate limits, hashed OTP/invite tokens, object authorization — [docs/SECURITY.md](./SECURITY.md) |
| Real-time | Socket.IO notifications, chat, offline replay — [docs/ARCHITECTURE.md](./ARCHITECTURE.md#realtime) |
| DevOps & Deployment | Docker, Kubernetes, Nginx, GitHub Actions — [docs/DEPLOYMENT.md](./DEPLOYMENT.md) |
| Documentation | Architecture, ADRs, SRS, Swagger/OpenAPI — [docs/](.) |
