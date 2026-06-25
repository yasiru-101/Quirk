/**
 * @file ensureDemoData.js
 * @description Non-destructive demo data repair for hosted environments.
 *
 * Unlike scripts/seed.js, this script never clears tables. It upserts the known
 * demo accounts and ensures they can log in with the documented credentials.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const demoUsers = [
  {
    name: 'System Admin',
    email: 'admin@quirk.app',
    passwordRaw: 'AdminPass123!',
    role: 'Admin',
    isPlatformAdmin: true,
    workspaceRole: 'Admin',
    projectRole: 'Project Manager',
  },
  {
    name: 'Sarah Manager',
    email: 'pm@quirk.app',
    passwordRaw: 'ManagerPass123!',
    role: 'Project Manager',
    isPlatformAdmin: false,
    workspaceRole: 'Project Manager',
    projectRole: 'Project Manager',
  },
  {
    name: 'Alex Developer',
    email: 'dev@quirk.app',
    passwordRaw: 'CollabPass123!',
    role: 'Collaborator',
    isPlatformAdmin: false,
    workspaceRole: 'Collaborator',
    projectRole: 'Collaborator',
  },
  {
    name: 'Emma Designer',
    email: 'emma@quirk.app',
    passwordRaw: 'CollabPass123!',
    role: 'Collaborator',
    isPlatformAdmin: false,
    workspaceRole: 'Collaborator',
    projectRole: 'Collaborator',
  },
];

const workflowColumns = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Completed'];

async function upsertDemoUser(user) {
  const passwordHash = await bcrypt.hash(user.passwordRaw, 12);
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      passwordHash,
      role: user.role,
      isPlatformAdmin: user.isPlatformAdmin,
      mustResetPassword: false,
      isActive: true,
      emailVerified: true,
    },
    create: {
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role,
      isPlatformAdmin: user.isPlatformAdmin,
      mustResetPassword: false,
      isActive: true,
      emailVerified: true,
      onboardingComplete: true,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to ensure demo data.');
  }

  console.log('Ensuring demo users and workspace data...');
  const users = [];
  for (const demoUser of demoUsers) {
    users.push(await upsertDemoUser(demoUser));
  }

  const adminUser = users.find((user) => user.email === 'admin@quirk.app');
  const pmUser = users.find((user) => user.email === 'pm@quirk.app');
  const devUser = users.find((user) => user.email === 'dev@quirk.app');
  const designerUser = users.find((user) => user.email === 'emma@quirk.app');

  let workspace = await prisma.workspace.findFirst({
    where: { name: 'Quirk Default Workspace' },
  });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Quirk Default Workspace',
        description: 'Demo workspace for the hosted Quirk environment.',
        ownerId: adminUser.id,
      },
    });
  }

  for (const [index, demoUser] of demoUsers.entries()) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: users[index].id,
        },
      },
      create: {
        workspaceId: workspace.id,
        userId: users[index].id,
        role: demoUser.workspaceRole,
      },
      update: { role: demoUser.workspaceRole },
    });
  }

  let project = await prisma.project.findFirst({
    where: {
      workspaceId: workspace.id,
      name: 'Main Board',
      deletedAt: null,
    },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Main Board',
        description: 'Primary project for tracking software development tasks.',
        workspaceId: workspace.id,
        createdBy: pmUser.id,
        templateType: 'Software Development',
      },
    });
  }

  for (const [index, demoUser] of demoUsers.entries()) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: users[index].id,
        },
      },
      create: {
        projectId: project.id,
        userId: users[index].id,
        role: demoUser.projectRole,
      },
      update: { role: demoUser.projectRole },
    });
  }

  const columnByName = {};
  for (const [order, name] of workflowColumns.entries()) {
    let column = await prisma.kanbanColumn.findFirst({
      where: { projectId: project.id, name },
    });
    if (!column) {
      column = await prisma.kanbanColumn.create({
        data: { projectId: project.id, name, order },
      });
    } else if (column.order !== order) {
      column = await prisma.kanbanColumn.update({
        where: { id: column.id },
        data: { order },
      });
    }
    columnByName[name] = column;
  }

  const taskFixtures = [
    {
      title: 'Design Dashboard Mockups',
      description: 'Create high fidelity visual designs for the main task tracking dashboard.',
      column: 'In Progress',
      priority: 'High',
      assignees: [designerUser.id, devUser.id],
      dueDays: 7,
    },
    {
      title: 'Setup Backend Server Scaffolding',
      description: 'Initialize express framework, setup folder structure, config routers, and middleware.',
      column: 'To Do',
      priority: 'High',
      assignees: [devUser.id],
      dueDays: 2,
    },
    {
      title: 'Write User Documentation',
      description: 'Write complete user guide for the Quirk application usage.',
      column: 'Completed',
      priority: 'Low',
      assignees: [designerUser.id],
      dueDays: -10,
    },
  ];

  for (const fixture of taskFixtures) {
    let task = await prisma.task.findFirst({
      where: { projectId: project.id, title: fixture.title, deletedAt: null },
    });
    if (!task) {
      task = await prisma.task.create({
        data: {
          title: fixture.title,
          description: fixture.description,
          createdBy: pmUser.id,
          projectId: project.id,
          columnId: columnByName[fixture.column].id,
          dueDate: new Date(Date.now() + fixture.dueDays * 24 * 60 * 60 * 1000),
          priority: fixture.priority,
        },
      });
    }

    for (const userId of fixture.assignees) {
      await prisma.taskAssignment.upsert({
        where: { taskId_userId: { taskId: task.id, userId } },
        create: { taskId: task.id, userId },
        update: {},
      });
    }
  }

  console.log('Demo data ensured.');
  console.log('Admin: admin@quirk.app / AdminPass123!');
  console.log('PM:    pm@quirk.app / ManagerPass123!');
  console.log('User:  dev@quirk.app / CollabPass123!');
}

main()
  .catch((error) => {
    console.error('Failed to ensure demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
