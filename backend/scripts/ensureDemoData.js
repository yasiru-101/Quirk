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

const showcaseUsers = [
  {
    name: 'Maya Fernando',
    email: 'demo.admin@quirk.app',
    passwordRaw: 'DemoAdmin123!',
    role: 'Admin',
    isPlatformAdmin: true,
    workspaceRole: 'Admin',
    projectRole: 'Project Manager',
  },
  {
    name: 'Noah Silva',
    email: 'demo.pm@quirk.app',
    passwordRaw: 'DemoManager123!',
    role: 'Project Manager',
    isPlatformAdmin: false,
    workspaceRole: 'Project Manager',
    projectRole: 'Project Manager',
  },
  {
    name: 'Isha Perera',
    email: 'demo.dev@quirk.app',
    passwordRaw: 'DemoDev123!',
    role: 'Collaborator',
    isPlatformAdmin: false,
    workspaceRole: 'Collaborator',
    projectRole: 'Collaborator',
  },
  {
    name: 'Liam Carter',
    email: 'demo.qa@quirk.app',
    passwordRaw: 'DemoQa123!',
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
      isPlatformAdmin: user.isPlatformAdmin,
      mustResetPassword: false,
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      onboardingComplete: true,
    },
    create: {
      name: user.name,
      email: user.email,
      passwordHash,
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

  console.log('Ensuring showcase workspace data...');
  const showcaseAccounts = [];
  for (const showcaseUser of showcaseUsers) {
    showcaseAccounts.push(await upsertDemoUser(showcaseUser));
  }

  const showcaseAdmin = showcaseAccounts.find((user) => user.email === 'demo.admin@quirk.app');
  const showcasePm = showcaseAccounts.find((user) => user.email === 'demo.pm@quirk.app');
  const showcaseDev = showcaseAccounts.find((user) => user.email === 'demo.dev@quirk.app');
  const showcaseQa = showcaseAccounts.find((user) => user.email === 'demo.qa@quirk.app');

  let showcaseWorkspace = await prisma.workspace.findFirst({
    where: { name: 'Quirk Demo Showcase' },
  });
  if (!showcaseWorkspace) {
    showcaseWorkspace = await prisma.workspace.create({
      data: {
        name: 'Quirk Demo Showcase',
        description: 'Presentation workspace with realistic launch tasks, chat, and notifications.',
        ownerId: showcaseAdmin.id,
      },
    });
  }

  for (const [index, showcaseUser] of showcaseUsers.entries()) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: showcaseWorkspace.id,
          userId: showcaseAccounts[index].id,
        },
      },
      create: {
        workspaceId: showcaseWorkspace.id,
        userId: showcaseAccounts[index].id,
        role: showcaseUser.workspaceRole,
      },
      update: { role: showcaseUser.workspaceRole },
    });
  }

  let showcaseProject = await prisma.project.findFirst({
    where: {
      workspaceId: showcaseWorkspace.id,
      name: 'Launch Readiness Board',
      deletedAt: null,
    },
  });
  if (!showcaseProject) {
    showcaseProject = await prisma.project.create({
      data: {
        name: 'Launch Readiness Board',
        description: 'Demo board for release planning, QA, and stakeholder follow-up.',
        workspaceId: showcaseWorkspace.id,
        createdBy: showcasePm.id,
        templateType: 'Software Development',
      },
    });
  }

  for (const [index, showcaseUser] of showcaseUsers.entries()) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: showcaseProject.id,
          userId: showcaseAccounts[index].id,
        },
      },
      create: {
        projectId: showcaseProject.id,
        userId: showcaseAccounts[index].id,
        role: showcaseUser.projectRole,
      },
      update: { role: showcaseUser.projectRole },
    });
  }

  const showcaseColumns = {};
  for (const [order, name] of workflowColumns.entries()) {
    let column = await prisma.kanbanColumn.findFirst({
      where: { projectId: showcaseProject.id, name },
    });
    if (!column) {
      column = await prisma.kanbanColumn.create({
        data: { projectId: showcaseProject.id, name, order },
      });
    } else if (column.order !== order) {
      column = await prisma.kanbanColumn.update({
        where: { id: column.id },
        data: { order },
      });
    }
    showcaseColumns[name] = column;
  }

  const showcaseTaskFixtures = [
    {
      title: 'Verify email fallback demo',
      description: 'Trigger register, password reset, and invitation emails and confirm the browser console shows the debug copy.',
      column: 'In Progress',
      priority: 'Urgent',
      assignees: [showcasePm.id, showcaseQa.id],
      dueDays: 1,
      tags: ['demo', 'email'],
    },
    {
      title: 'Walk through workspace member roles',
      description: 'Show Admin, Project Manager, and Collaborator permissions inside one tenant workspace.',
      column: 'To Do',
      priority: 'High',
      assignees: [showcaseAdmin.id, showcasePm.id],
      dueDays: 2,
      tags: ['rbac', 'workspace'],
    },
    {
      title: 'Prepare chatbot regression check',
      description: 'Open the floating AI panel from dashboard, tasks, and chat pages to prove the blackout is fixed.',
      column: 'In Review',
      priority: 'High',
      assignees: [showcaseDev.id],
      dueDays: 1,
      tags: ['ai', 'frontend'],
    },
    {
      title: 'Attach release checklist PDF',
      description: 'Upload and remove a task attachment to demonstrate the latest attachment workflow.',
      column: 'Backlog',
      priority: 'Medium',
      assignees: [showcaseQa.id],
      dueDays: 5,
      tags: ['attachments'],
    },
    {
      title: 'Finalize launch notes',
      description: 'Complete the short presenter notes for the final demo walkthrough.',
      column: 'Completed',
      priority: 'Low',
      assignees: [showcasePm.id],
      dueDays: -1,
      tags: ['docs'],
    },
  ];

  const showcaseTasks = {};
  for (const fixture of showcaseTaskFixtures) {
    let task = await prisma.task.findFirst({
      where: { projectId: showcaseProject.id, title: fixture.title, deletedAt: null },
    });
    if (!task) {
      task = await prisma.task.create({
        data: {
          title: fixture.title,
          description: fixture.description,
          createdBy: showcasePm.id,
          projectId: showcaseProject.id,
          columnId: showcaseColumns[fixture.column].id,
          dueDate: new Date(Date.now() + fixture.dueDays * 24 * 60 * 60 * 1000),
          priority: fixture.priority,
          tags: fixture.tags,
        },
      });
    }
    showcaseTasks[fixture.title] = task;

    for (const userId of fixture.assignees) {
      await prisma.taskAssignment.upsert({
        where: { taskId_userId: { taskId: task.id, userId } },
        create: { taskId: task.id, userId },
        update: {},
      });
    }
  }

  const showcaseNotifications = [
    {
      recipientId: showcaseQa.id,
      type: 'Assignment',
      message: 'You were assigned to "Verify email fallback demo"',
      relatedTaskId: showcaseTasks['Verify email fallback demo'].id,
      isRead: false,
    },
    {
      recipientId: showcaseDev.id,
      type: 'Assignment',
      message: 'You were assigned to "Prepare chatbot regression check"',
      relatedTaskId: showcaseTasks['Prepare chatbot regression check'].id,
      isRead: false,
    },
  ];
  for (const notification of showcaseNotifications) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        recipientId: notification.recipientId,
        relatedTaskId: notification.relatedTaskId,
        message: notification.message,
      },
    });
    if (!existingNotification) {
      await prisma.notification.create({ data: notification });
    }
  }

  let showcaseRoom = await prisma.conversation.findFirst({
    where: { type: 'PROJECT', projectId: showcaseProject.id },
  });
  if (!showcaseRoom) {
    showcaseRoom = await prisma.conversation.create({
      data: {
        type: 'PROJECT',
        projectId: showcaseProject.id,
        workspaceId: showcaseWorkspace.id,
        participants: {
          create: showcaseAccounts.map((user) => ({ userId: user.id })),
        },
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        {
          conversationId: showcaseRoom.id,
          senderId: showcasePm.id,
          content: 'Demo board is ready. Please keep the email fallback and AI panel checks near the top.',
        },
        {
          conversationId: showcaseRoom.id,
          senderId: showcaseQa.id,
          content: 'I will verify the browser console output during the invite flow.',
        },
      ],
    });
  }

  console.log('Demo data ensured.');
  console.log('Admin: admin@quirk.app / AdminPass123!');
  console.log('PM:    pm@quirk.app / ManagerPass123!');
  console.log('User:  dev@quirk.app / CollabPass123!');
  console.log('Showcase Admin: demo.admin@quirk.app / DemoAdmin123!');
  console.log('Showcase PM:    demo.pm@quirk.app / DemoManager123!');
  console.log('Showcase Dev:   demo.dev@quirk.app / DemoDev123!');
  console.log('Showcase QA:    demo.qa@quirk.app / DemoQa123!');
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
