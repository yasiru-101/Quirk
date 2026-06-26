/**
 * @file seedPlatformAdmin.js
 * @description Creates the minimum account needed to regain platform access after
 * a database reset.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const email = process.env.SEED_ADMIN_EMAIL || 'admin@quirk.app';
const password = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!';
const name = process.env.SEED_ADMIN_NAME || 'Platform Admin';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const seedPlatformAdmin = async () => {
  try {
    await prisma.$connect();

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
      where: { email },
      create: {
        name,
        email,
        passwordHash,
        isPlatformAdmin: true,
        mustResetPassword: false,
        isActive: true,
        emailVerified: true,
        onboardingComplete: true,
      },
      update: {
        name,
        passwordHash,
        isPlatformAdmin: true,
        mustResetPassword: false,
        isActive: true,
        emailVerified: true,
        onboardingComplete: true,
      },
    });

    let workspace = await prisma.workspace.findFirst({
      where: { ownerId: admin.id, name: 'Platform Admin Workspace' },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Platform Admin Workspace',
          description: 'Minimal workspace for the platform administrator account.',
          ownerId: admin.id,
        },
      });
    }

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: admin.id } },
      create: { workspaceId: workspace.id, userId: admin.id, role: 'Admin' },
      update: { role: 'Admin' },
    });

    console.log('Platform admin seeded.');
    console.log(`Admin: ${email} / ${password}`);
  } catch (error) {
    console.error('Platform admin seed failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
};

seedPlatformAdmin();

