/**
 * @file db.js
 * @description Exposes a singleton instance of the PrismaClient using a PostgreSQL Driver Adapter.
 * Required for compatibility with Prisma 7.
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Setup PostgreSQL Connection Pool
// Cloud Postgres (e.g. Supabase, Azure) requires TLS; the local Docker Postgres
// used for development does not. Enable SSL unless connecting to localhost, or
// honour an explicit DATABASE_SSL=false override.
const connectionString = process.env.DATABASE_URL || '';
const isLocalDb = /@(localhost|127\.0\.0\.1|postgres)[:/]/.test(connectionString);
const useSsl =
  process.env.DATABASE_SSL === 'false'
    ? false
    : process.env.DATABASE_SSL === 'true' || !isLocalDb;

// Pool sizing matters on managed Postgres (e.g. Supabase) where the connection
// limit is small. An oversized pool — multiplied across replicas — exhausts the
// upstream limit; once every client connection is busy, node-pg queues new
// queries *indefinitely* (no default acquire timeout), so heavier requests like
// the task list hang while a single-query login still succeeds. We therefore cap
// the pool and fail fast on acquisition instead of hanging.
const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '5', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '10000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
});

// Surface pool-level errors (e.g. an idle connection dropped by the server)
// instead of letting them crash the process or silently poison the pool.
pool.on('error', (err) => {
  console.error(`[db] Idle PostgreSQL client error: ${err.message}`);
});
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with pg Driver Adapter
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;
