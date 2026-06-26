/**
 * @file resetExceptSuperAdmin.js
 * @description Wipes all tenant data so you can re-test with fresh, proper users,
 * while KEEPING the platform super-admin account(s) intact.
 *
 * What it deletes: every workspace, project, task, comment, attachment, time log,
 * activity log, notification, conversation, chat message, invitation, OTP code,
 * and every non-platform-admin user.
 *
 * What it keeps: users with `isPlatformAdmin = true` (the super admin). By default
 * it keeps ALL platform admins; pass --email=foo@bar.com to keep only that one.
 *
 * The kept admin is left with no workspaces/memberships — a genuine clean slate.
 *
 * Safety: this is destructive and irreversible. It refuses to run without the
 * explicit --yes flag, and aborts if it would leave zero accounts.
 *
 * Usage:
 *   node scripts/resetExceptSuperAdmin.js --yes
 *   node scripts/resetExceptSuperAdmin.js --yes --email=admin@quirk.app
 *   npm run db:reset-keep-admin -- --yes        (from backend/)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
const confirmed = args.includes('--yes');
const emailArg = (args.find((a) => a.startsWith('--email=')) || '').split('=')[1];

// Child-before-parent order so foreign keys (including Restrict relations on the
// kept user) never block a delete.
const DELETE_ORDER = [
  'chatMessage',
  'conversationParticipant',
  'conversation',
  'notification',
  'activityLog',
  'timeLog',
  'attachment',
  'comment',
  'taskAssignment',
  'taskDependency',
  'task',
  'kanbanColumn',
  'epic',
  'projectMember',
  'project',
  'projectTemplateColumn',
  'projectTemplate',
  'invitation',
  'otpCode',
  'workspaceMember',
  'workspace',
];

async function main() {
  if (!confirmed) {
    console.error('\nRefusing to run without confirmation.');
    console.error('This DELETES all data except the platform super-admin account.');
    console.error('Re-run with --yes to proceed, e.g.:');
    console.error('  node scripts/resetExceptSuperAdmin.js --yes\n');
    process.exitCode = 1;
    return;
  }

  // Work out which users survive.
  const keepWhere = emailArg
    ? { email: emailArg.toLowerCase(), isPlatformAdmin: true }
    : { isPlatformAdmin: true };

  const kept = await prisma.user.findMany({
    where: keepWhere,
    select: { id: true, name: true, email: true },
  });

  if (kept.length === 0) {
    console.error(
      emailArg
        ? `\nAborting: no platform admin found with email "${emailArg}". Nothing was deleted.\n`
        : '\nAborting: no platform admin (isPlatformAdmin = true) exists, so nothing would survive. No changes made.\n'
    );
    process.exitCode = 1;
    return;
  }

  const keptIds = kept.map((u) => u.id);
  console.log('\nKeeping super-admin account(s):');
  kept.forEach((u) => console.log(`  • ${u.name} <${u.email}>`));

  // 1. Wipe all tenant data.
  console.log('\nDeleting tenant data...');
  for (const model of DELETE_ORDER) {
    const { count } = await prisma[model].deleteMany({});
    if (count) console.log(`  - ${model}: ${count}`);
  }

  // 2. Delete every user that is not being kept.
  const removedUsers = await prisma.user.deleteMany({
    where: { id: { notIn: keptIds } },
  });
  console.log(`  - users removed: ${removedUsers.count}`);

  console.log('\nDone. The super-admin remains with a clean slate (no workspaces).');
  console.log('Create fresh users via registration or the platform console.\n');
}

main()
  .catch((err) => {
    console.error('Reset failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
