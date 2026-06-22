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

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with pg Driver Adapter
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;
