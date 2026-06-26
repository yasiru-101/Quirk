# Deployment

Quirk is containerized and deployed to **Azure Kubernetes Service (AKS)** through a
**GitHub Actions** pipeline. This document describes the images, manifests,
pipeline, and configuration. It is the companion to the manifests in
[`k8s/`](../k8s) and the workflow in
[`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml).

## Live demo

| Surface | URL |
| --- | --- |
| Frontend (SPA) | https://quirk-app.ddns.net |
| Backend API | https://quirk-app.ddns.net/api |
| API docs (Swagger UI) | https://quirk-app.ddns.net/api-docs |

> The frontend Nginx pod reverse-proxies `/api`, `/api-docs`, and `/socket.io` to
> the backend service, so both tiers share one public host and TLS certificate.

## Topology

```
Internet
  │  HTTPS (TLS via cert-manager + Let's Encrypt)
  ▼
Ingress (ingress-nginx)  quirk-app.ddns.net
  │
  ▼
quirk-frontend-svc ──► Frontend pods (Nginx serving the built SPA)
                          │  proxies /api, /api-docs, /socket.io
                          ▼
                       quirk-backend-svc ──► Backend pods (Express, 2 replicas)
                                                │
                                                ▼
                                       Azure PostgreSQL (TLS)
                                       Azure Blob Storage (attachments)
                                       Azure Communication Services (email)
```

## Container images

| Image | Build context | Contents |
| --- | --- | --- |
| `quirkimsacr.azurecr.io/quirk-backend` | [`backend/Dockerfile`](../backend/Dockerfile) | Node.js + Express API |
| `quirkimsacr.azurecr.io/quirk-frontend` | [`frontend/Dockerfile`](../frontend/Dockerfile) | Vite build served by Nginx ([`frontend/nginx.conf`](../frontend/nginx.conf)) |

Images are pushed to **Azure Container Registry (ACR)** tagged with both the commit
SHA and `latest`. The frontend bakes `VITE_API_URL` in at build time via a build
arg.

## Kubernetes manifests (`k8s/`)

| File | Resource | Purpose |
| --- | --- | --- |
| `namespace.yaml` | Namespace | `quirk` namespace |
| `configmap.yaml` | ConfigMap `quirk-config` | Non-secret env (`NODE_ENV`, `PORT`, `FRONTEND_URL`) |
| `secret.yaml` | Secret (template) | **Placeholder only** — real `quirk-secrets` is created out-of-band |
| `backend-deployment.yaml` | Deployment | 2 replicas, rolling update, readiness/liveness on `/api/health`, resource limits, env from ConfigMap + Secret |
| `backend-service.yaml` | Service | `quirk-backend-svc` (ClusterIP :5000) |
| `frontend-deployment.yaml` | Deployment | Nginx serving the SPA |
| `frontend-service.yaml` | Service | `quirk-frontend-svc` (:80) |
| `issuer.yaml` | ClusterIssuer | `letsencrypt-prod` for cert-manager |
| `ingress.yaml` | Ingress | TLS host `quirk-app.ddns.net`, 50 MB body limit, SSL redirect |

## CI/CD pipeline

The workflow runs on push/PR to `main` (and manual dispatch) in three stages:

1. **Validate** (every push & PR) — enforces the SRS §8 pre-merge gates:
   - Backend: `npm install`, `node --check` on every `.js`, `npx prisma validate`.
   - Frontend: `npm install`, `npm run build`.
2. **Build & Push to ACR** (pushes to `main` only):
   - `npx prisma db push` against Azure PostgreSQL (additive; no `--accept-data-loss`).
   - Build and push the backend and frontend images (SHA + `latest`).
3. **Deploy to AKS** (pushes to `main` only):
   - Set kubectl context to the AKS cluster.
   - Pin image tags to the commit SHA in the deployment manifests.
   - Sync AI provider keys into `quirk-secrets` (Gemini required, Groq optional).
   - `kubectl apply` the manifests, wait for rollout, print pods.

## Configuration & secrets

Non-secret config lives in `quirk-config` (ConfigMap). Secrets live in the
`quirk-secrets` Kubernetes Secret, created imperatively and **never** committed
(`k8s/secret.yaml` is a placeholder template). Required vs optional keys mirror
[`backend/.env.example`](../backend/.env.example):

| Key | Required | Used for |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection (TLS) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | ✅ | Token signing (server fails fast if unset) |
| `AZURE_BLOB_CONNECTION_STRING` | optional | Attachment storage |
| `AZURE_ACS_CONNECTION_STRING`, `AZURE_ACS_SENDER_ADDRESS` | optional | Transactional email |
| `GEMINI_API_KEY` | optional* | AI assistant (primary provider) |
| `GROQ_API_KEY` | optional | AI assistant (fallback provider) |

\* The deploy job treats `GEMINI_API_KEY` as required and fails loudly if the
repository secret is empty, to avoid the assistant silently booting "not
configured". See [AI_ASSISTANT.md](./AI_ASSISTANT.md) and [SECURITY.md](./SECURITY.md).

GitHub Actions repository secrets used by the pipeline: `AZURE_CREDENTIALS`,
`DATABASE_URL`, `VITE_API_URL`, `GEMINI_API_KEY`, `GROQ_API_KEY`.

## Local container run

For a production-like local stack (Postgres + backend + frontend):

```bash
docker-compose up --build
# Frontend: http://localhost:3000   Backend: http://localhost:5000
```

See [`docker-compose.yml`](../docker-compose.yml). For day-to-day development,
prefer the Vite/nodemon dev servers described in the [README](../README.md).

## Manual deploy (reference)

The pipeline does this automatically; the manual equivalent is:

```bash
az acr login --name quirkimsacr
az aks get-credentials -g TaskFlow-RG -n quirk-aks

# Apply schema, build/push images (tagging as appropriate), then:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/issuer.yaml
kubectl apply -f k8s/ingress.yaml
kubectl rollout status deployment/quirk-backend -n quirk
```
