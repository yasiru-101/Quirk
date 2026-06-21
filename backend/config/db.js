/**
 * @file db.js
 * @description Exposes a singleton instance of the PrismaClient using a PostgreSQL Driver Adapter.
 * Required for compatibility with Prisma 7.
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Setup PostgreSQL Connection Pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with pg Driver Adapter
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;
