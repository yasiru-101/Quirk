/**
 * @file seed.js
 * @description Seeds PostgreSQL with a realistic multi-tenant demo.
 *
 * Tenancy model (ADR 0002): there is no shared "default" workspace. The seed
 * creates one realistic demo organization ("Northwind Labs") that the test
 * accounts belong to, AND gives every user their own empty personal workspace
 * so tenant isolation is visible. Real self-registrations get their personal
 * workspace through onboarding — never auto-joined to anyone else's tenant.
 *
 * Run with: npm run seed
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const hash = async (raw) => bcrypt.hash(raw, await bcrypt.genSalt(12));

// ─── Seed Data Definitions ──────────────────────────────────────────────────
// tenantRole = ordinary product role; orgRole = role inside the Northwind workspace.
const USERS = [
  { key: 'sarah',  name: 'Sarah Chen',    email: 'admin@quirk.app', password: 'AdminPass123!',   tenantRole: 'Admin',           orgRole: 'Admin',           isPlatformAdmin: true,  jobTitle: 'Head of Product',      timezone: 'America/New_York',    mustResetPassword: false },
  { key: 'marcus', name: 'Marcus Reyes',  email: 'pm@quirk.app',    password: 'ManagerPass123!', tenantRole: 'Project Manager', orgRole: 'Project Manager', isPlatformAdmin: false, jobTitle: 'Engineering Manager',  timezone: 'America/Los_Angeles', mustResetPassword: false },
  { key: 'priya',  name: 'Priya Nair',    email: 'dev@quirk.app',   password: 'CollabPass123!',  tenantRole: 'Collaborator',    orgRole: 'Collaborator',    isPlatformAdmin: false, jobTitle: 'Senior Engineer',      timezone: 'Asia/Kolkata',        mustResetPassword: false },
  { key: 'emma',   name: 'Emma Wilson',   email: 'emma@quirk.app',  password: 'CollabPass123!',  tenantRole: 'Collaborator',    orgRole: 'Collaborator',    isPlatformAdmin: false, jobTitle: 'Product Designer',     timezone: 'Europe/London',       mustResetPassword: true  },
  { key: 'leo',    name: 'Leo Martins',   email: 'leo@quirk.app',   password: 'CollabPass123!',  tenantRole: 'Collaborator',    orgRole: 'Collaborator',    isPlatformAdmin: false, jobTitle: 'Frontend Engineer',    timezone: 'America/Sao_Paulo',   mustResetPassword: false },
  { key: 'aisha',  name: 'Aisha Khan',    email: 'aisha@quirk.app', password: 'CollabPass123!',  tenantRole: 'Collaborator',    orgRole: 'Collaborator',    isPlatformAdmin: false, jobTitle: 'QA Engineer',          timezone: 'Asia/Dubai',          mustResetPassword: false },
];

const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

const seedDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('Database connected.');

    // ─── 1. Clear (children → parents) ───────────────────────────────────────
    console.log('Clearing existing records...');
    await prisma.chatMessage.deleteMany({});
    await prisma.conversationParticipant.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.activityLog.deleteMany({});
    await prisma.timeLog.deleteMany({});
    await prisma.taskAssignment.deleteMany({});
    await prisma.taskDependency.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.epic.deleteMany({});
    await prisma.kanbanColumn.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.workspaceMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.otpCode.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Cleared.');

    // ─── 2. Users ────────────────────────────────────────────────────────────
    console.log('Seeding users...');
    const u = {}; // keyed by USERS[].key
    for (const def of USERS) {
      u[def.key] = await prisma.user.create({
        data: {
          name: def.name,
          email: def.email,
          passwordHash: await hash(def.password),
          isPlatformAdmin: def.isPlatformAdmin,
          jobTitle: def.jobTitle,
          timezone: def.timezone,
          mustResetPassword: def.mustResetPassword,
          isActive: true,
          emailVerified: true,
          onboardingComplete: true,
        },
      });
    }
    console.log(`Seeded ${USERS.length} users.`);

    // ─── 3. Personal workspaces (empty, one Owner each) ──────────────────────
    console.log('Seeding personal workspaces...');
    for (const def of USERS) {
      const owner = u[def.key];
      await prisma.workspace.create({
        data: {
          name: `${def.name.split(' ')[0]}'s Workspace`,
          description: 'Personal workspace.',
          ownerId: owner.id,
          members: { create: { userId: owner.id, role: 'Admin' } },
        },
      });
    }

    // ─── 4. Demo organization workspace ──────────────────────────────────────
    console.log('Seeding demo organization (Northwind Labs)...');
    const org = await prisma.workspace.create({
      data: {
        name: 'Northwind Labs',
        description: 'Product and engineering team building the Northwind platform.',
        ownerId: u.sarah.id,
        members: {
          create: USERS.map((def) => ({ userId: u[def.key].id, role: def.orgRole })),
        },
      },
    });

    // ─── 5. Projects, columns, epics ─────────────────────────────────────────
    console.log('Seeding projects...');
    const buildColumns = () => COLUMNS.map((name, i) => ({ name, order: i }));

    const website = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Rebuild the marketing site and design system.',
        workspaceId: org.id,
        createdBy: u.marcus.id,
        templateType: 'Software Development',
        columns: { create: buildColumns() },
        members: {
          create: [
            { userId: u.marcus.id, role: 'Project Manager' },
            { userId: u.priya.id, role: 'Collaborator' },
            { userId: u.emma.id, role: 'Collaborator' },
            { userId: u.leo.id, role: 'Collaborator' },
          ],
        },
      },
      include: { columns: true },
    });

    const mobile = await prisma.project.create({
      data: {
        name: 'Mobile App v2',
        description: 'Native mobile client with offline sync.',
        workspaceId: org.id,
        createdBy: u.marcus.id,
        templateType: 'Software Development',
        columns: { create: buildColumns() },
        members: {
          create: [
            { userId: u.marcus.id, role: 'Project Manager' },
            { userId: u.priya.id, role: 'Collaborator' },
            { userId: u.aisha.id, role: 'Collaborator' },
          ],
        },
      },
      include: { columns: true },
    });

    const colOf = (project, name) => project.columns.find((c) => c.name === name).id;

    const designEpic = await prisma.epic.create({
      data: { projectId: website.id, name: 'Design System', color: '#75EE8F' },
    });
    const marketingEpic = await prisma.epic.create({
      data: { projectId: website.id, name: 'Marketing Site', color: '#F4A261' },
    });

    // ─── 6. Tasks ────────────────────────────────────────────────────────────
    console.log('Seeding tasks...');
    const mk = (data) => prisma.task.create({ data });

    const tDesignTokens = await mk({
      title: 'Define design tokens', description: 'Color, spacing, and typography tokens for the new design system.',
      projectId: website.id, createdBy: u.marcus.id, columnId: colOf(website, 'In Progress'),
      epicId: designEpic.id, priority: 'High', dueDate: daysFromNow(4), estimatedHours: 12, tags: ['design', 'foundation'],
    });
    const tComponentLib = await mk({
      title: 'Build component library', description: 'Reusable Button, Input, Modal, and Card components.',
      projectId: website.id, createdBy: u.marcus.id, columnId: colOf(website, 'To Do'),
      epicId: designEpic.id, priority: 'High', dueDate: daysFromNow(10), estimatedHours: 24, tags: ['design', 'frontend'],
    });
    const tHeroSection = await mk({
      title: 'Marketing hero section', description: 'Above-the-fold hero with CTA and product screenshot.',
      projectId: website.id, createdBy: u.emma.id, columnId: colOf(website, 'In Review'),
      epicId: marketingEpic.id, priority: 'Medium', dueDate: daysFromNow(2), estimatedHours: 8, tags: ['marketing'],
    });
    const tSeoAudit = await mk({
      title: 'SEO and accessibility audit', description: 'Lighthouse pass and WCAG AA review before launch.',
      projectId: website.id, createdBy: u.marcus.id, columnId: colOf(website, 'Backlog'),
      priority: 'Low', dueDate: daysFromNow(18), estimatedHours: 6, tags: ['quality'],
    });
    const tOldCopy = await mk({
      title: 'Migrate legacy blog content', description: 'Move existing posts into the new CMS structure.',
      projectId: website.id, createdBy: u.leo.id, columnId: colOf(website, 'Done'),
      priority: 'Medium', dueDate: daysFromNow(-6), estimatedHours: 10, tags: ['content'],
    });

    const tOfflineSync = await mk({
      title: 'Offline sync engine', description: 'Queue mutations locally and reconcile on reconnect.',
      projectId: mobile.id, createdBy: u.marcus.id, columnId: colOf(mobile, 'In Progress'),
      priority: 'Urgent', dueDate: daysFromNow(-1), estimatedHours: 30, tags: ['backend', 'sync'],
    });
    const tPushNotif = await mk({
      title: 'Push notifications', description: 'APNs and FCM integration for task reminders.',
      projectId: mobile.id, createdBy: u.marcus.id, columnId: colOf(mobile, 'To Do'),
      priority: 'High', dueDate: daysFromNow(7), estimatedHours: 16, tags: ['mobile'],
    });
    const tCrashFix = await mk({
      title: 'Fix cold-start crash on Android 12', description: 'NPE in the splash controller on first launch.',
      projectId: mobile.id, createdBy: u.aisha.id, columnId: colOf(mobile, 'In Review'),
      priority: 'Urgent', dueDate: daysFromNow(1), estimatedHours: 4, tags: ['bug', 'android'],
    });

    // Subtask under the component library task
    await mk({
      title: 'Button variants', description: 'Primary, secondary, and icon variants.',
      projectId: website.id, createdBy: u.priya.id, columnId: colOf(website, 'To Do'),
      parentTaskId: tComponentLib.id, priority: 'Medium', estimatedHours: 6, tags: ['frontend'],
    });

    // ─── 7. Assignments ──────────────────────────────────────────────────────
    console.log('Seeding assignments...');
    await prisma.taskAssignment.createMany({
      data: [
        { taskId: tDesignTokens.id, userId: u.emma.id },
        { taskId: tComponentLib.id, userId: u.priya.id },
        { taskId: tComponentLib.id, userId: u.leo.id },
        { taskId: tHeroSection.id, userId: u.emma.id },
        { taskId: tOfflineSync.id, userId: u.priya.id },
        { taskId: tPushNotif.id, userId: u.priya.id },
        { taskId: tCrashFix.id, userId: u.aisha.id },
      ],
    });

    // ─── 8. Dependency (component library blocked by design tokens) ──────────
    await prisma.taskDependency.create({
      data: { blockingTaskId: tDesignTokens.id, blockedTaskId: tComponentLib.id },
    });

    // ─── 9. Comments ─────────────────────────────────────────────────────────
    console.log('Seeding comments...');
    await prisma.comment.createMany({
      data: [
        { taskId: tDesignTokens.id, userId: u.emma.id, content: 'First pass of the palette is ready for review.' },
        { taskId: tDesignTokens.id, userId: u.marcus.id, content: 'Looks great @Emma Wilson — please lock the spacing scale next.' },
        { taskId: tOfflineSync.id, userId: u.priya.id, content: 'Conflict resolution is trickier than expected; may need another day.' },
        { taskId: tCrashFix.id, userId: u.aisha.id, content: 'Reproduced on a Pixel 6. Stack trace attached in the activity log.' },
      ],
    });

    // ─── 10. Activity + time logs ────────────────────────────────────────────
    console.log('Seeding activity and time logs...');
    await prisma.activityLog.createMany({
      data: [
        { taskId: tHeroSection.id, userId: u.emma.id, action: 'column_changed', metadata: { from: 'In Progress', to: 'In Review' } },
        { taskId: tOldCopy.id, userId: u.leo.id, action: 'column_changed', metadata: { from: 'In Review', to: 'Done' } },
        { taskId: tOfflineSync.id, userId: u.priya.id, action: 'commented', metadata: {} },
      ],
    });
    await prisma.timeLog.createMany({
      data: [
        { taskId: tOfflineSync.id, userId: u.priya.id, hours: 6.5, note: 'Mutation queue scaffolding' },
        { taskId: tHeroSection.id, userId: u.emma.id, hours: 3, note: 'Layout and responsive pass' },
      ],
    });

    // ─── 11. Notifications (mix of read/unread, with relatedTaskId) ──────────
    console.log('Seeding notifications...');
    await prisma.notification.createMany({
      data: [
        { recipientId: u.emma.id, type: 'Assignment', message: 'You were assigned to "Define design tokens"', relatedTaskId: tDesignTokens.id, isRead: false },
        { recipientId: u.emma.id, type: 'Comment', message: 'Marcus Reyes mentioned you on "Define design tokens"', relatedTaskId: tDesignTokens.id, isRead: false },
        { recipientId: u.priya.id, type: 'Assignment', message: 'You were assigned to "Offline sync engine"', relatedTaskId: tOfflineSync.id, isRead: true },
        { recipientId: u.priya.id, type: 'Deadline', message: '"Offline sync engine" is overdue', relatedTaskId: tOfflineSync.id, isRead: false },
        { recipientId: u.aisha.id, type: 'Assignment', message: 'You were assigned to "Fix cold-start crash on Android 12"', relatedTaskId: tCrashFix.id, isRead: false },
        { recipientId: u.marcus.id, type: 'ColumnChange', message: 'Emma Wilson moved "Marketing hero section" to In Review', relatedTaskId: tHeroSection.id, isRead: false },
      ],
    });

    // ─── 12. Chat: project room + a DM ───────────────────────────────────────
    console.log('Seeding conversations...');
    const websiteRoom = await prisma.conversation.create({
      data: {
        type: 'PROJECT', projectId: website.id, workspaceId: org.id,
        participants: { create: [u.marcus, u.priya, u.emma, u.leo].map((m) => ({ userId: m.id })) },
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        { conversationId: websiteRoom.id, senderId: u.marcus.id, content: 'Kicking off the redesign — design tokens are the first blocker.' },
        { conversationId: websiteRoom.id, senderId: u.emma.id, content: 'On it. Sharing the palette today.' },
        { conversationId: websiteRoom.id, senderId: u.leo.id, content: 'I can start wiring components once tokens land.' },
      ],
    });

    const dm = await prisma.conversation.create({
      data: {
        type: 'DIRECT', workspaceId: org.id,
        participants: { create: [{ userId: u.marcus.id }, { userId: u.priya.id }] },
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        { conversationId: dm.id, senderId: u.marcus.id, content: 'How is the offline sync conflict handling coming along?' },
        { conversationId: dm.id, senderId: u.priya.id, content: 'Almost there — pushing a draft PR tonight.' },
      ],
    });

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log('\n=========================================');
    console.log('Database seeded: Northwind Labs demo org + personal workspaces.');
    console.log('Test accounts (all in "Northwind Labs"):');
    console.log('  Platform Admin   : admin@quirk.app  / AdminPass123!');
    console.log('  Project Manager  : pm@quirk.app     / ManagerPass123!');
    console.log('  Collaborator     : dev@quirk.app    / CollabPass123!');
    console.log('  Collaborator     : leo@quirk.app    / CollabPass123!');
    console.log('  Collaborator     : aisha@quirk.app  / CollabPass123!');
    console.log('  Collaborator     : emma@quirk.app   / CollabPass123! (must reset password)');
    console.log('=========================================\n');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log('Disconnected from database.');
  }
};

seedDatabase();
