# ─────────────────────────────────────────────────────────────────────────────
# Quirk Frontend — Multi-Stage Dockerfile
# Stage 1: Build the Vite/React app
# Stage 2: Serve with nginx (tiny alpine image)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Deterministic, lockfile-faithful install for reproducible builds.
RUN npm ci

COPY . .

# VITE_API_URL is an OPTIONAL build-time override for the API base URL.
# In this deployment it must be left EMPTY/unset: the app falls back to the relative
# "/api" path (see src/utils/constants.js), and nginx proxies /api, /socket.io and
# /api-docs to the backend service (see nginx.conf). The backend has no public
# ingress route, and an absolute cross-origin URL here would also break the
# SameSite=strict auth cookies. Only set this for a split-origin setup with CORS.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
