# ─────────────────────────────────────────────────────────────────────────────
# Quirk Backend — Multi-Stage Dockerfile
# Stage 1: Install production dependencies
# Stage 2: Generate Prisma client
# Stage 3: Lean production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install production dependencies ─────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
# Install only production dependencies (no devDependencies)
RUN npm ci --only=production

# ── Stage 2: Generate Prisma client ──────────────────────────────────────────
FROM node:22-alpine AS prisma-gen
WORKDIR /app

COPY package*.json ./
# Install all deps (including prisma CLI in devDependencies)
RUN npm ci

COPY prisma ./prisma
# Generate Prisma client from schema
RUN npx prisma generate

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy generated Prisma client from stage 2 (overrides the one without adapter)
COPY --from=prisma-gen /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-gen /app/node_modules/@prisma ./node_modules/@prisma

# Copy application source (excludes .dockerignore entries)
COPY . .

# Expose backend port
EXPOSE 5000

# Health check — used by Kubernetes readiness/liveness probes
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
