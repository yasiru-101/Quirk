/**
 * @file workspaceController.js
 * @description Workspace tenancy: creation, membership, and invitations.
 *
 * A workspace is the top-level tenant. The creator becomes its Owner. Other users
 * join either by accepting an emailed invitation or, in future, by self-registering
 * against an open invite. Membership roles (Owner, Admin, Member) are enforced by
 * the membership middleware, not here.
 */

const crypto = require('crypto');
const prisma = require('../config/db');
const emailService = require('../services/emailService');
const { WORKSPACE_ADMIN_ROLES, isWorkspaceAdmin } = require('../utils/roles');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ─── Create Workspace ───────────────────────────────────────────────────────
// @route  POST /api/workspaces
// @access Any authenticated user
const createWorkspace = async (req, res) => {
  const { name, description } = req.body;
  try {
    const workspace = await prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: { name, description: description || null, ownerId: req.user.id },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: created.id, userId: req.user.id, role: 'Admin' },
      });
      return created;
    });
    return res.status(201).json({ workspace });
  } catch (error) {
    console.error(`Create workspace error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during workspace creation' });
  }
};

// ─── List My Workspaces ─────────────────────────────────────────────────────
// @route  GET /api/workspaces
// @access Any authenticated user
const getMyWorkspaces = async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: { _count: { select: { members: true, projects: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      myRole: m.role,
      memberCount: m.workspace._count.members,
      projectCount: m.workspace._count.projects,
    }));

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error(`List workspaces error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching workspaces' });
  }
};

// ─── Get Workspace by ID ────────────────────────────────────────────────────
// @route  GET /api/workspaces/:id
// @access Workspace member (enforced by requireWorkspaceRole)
const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        projects: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true },
        },
      },
    });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    return res.status(200).json({ workspace });
  } catch (error) {
    console.error(`Get workspace error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching workspace' });
  }
};

// ─── List Members ───────────────────────────────────────────────────────────
// @route  GET /api/workspaces/:id/members
// @access Workspace member
const listMembers = async (req, res) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    
    // Fetch pending invitations to display in the same list
    const pendingInvites = await prisma.invitation.findMany({
      where: { workspaceId: req.params.id, status: 'pending' },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ members, pendingInvites });
  } catch (error) {
    console.error(`List members error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching members' });
  }
};

// ─── Update Member Role ─────────────────────────────────────────────────────
// @route  PATCH /api/workspaces/:id/members/:userId
// @access Owner | Admin
const updateMemberRole = async (req, res) => {
  const { id: workspaceId, userId } = req.params;
  const { role } = req.body;
  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // Never leave a workspace without an administrator.
    if (isWorkspaceAdmin(member) && !WORKSPACE_ADMIN_ROLES.includes(role)) {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: { in: WORKSPACE_ADMIN_ROLES } },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'A workspace must retain at least one Admin.' });
      }
    }

    const updated = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
    return res.status(200).json({ member: updated });
  } catch (error) {
    console.error(`Update member role error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error updating member role' });
  }
};

// ─── Remove Member ──────────────────────────────────────────────────────────
// @route  DELETE /api/workspaces/:id/members/:userId
// @access Owner | Admin
const removeMember = async (req, res) => {
  const { id: workspaceId, userId } = req.params;
  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (isWorkspaceAdmin(member)) {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: { in: WORKSPACE_ADMIN_ROLES } },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'A workspace must retain at least one Admin.' });
      }
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(`Remove member error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error removing member' });
  }
};

// @route  DELETE /api/workspaces/:id/leave
// @access Workspace member
const leaveWorkspace = async (req, res) => {
  const workspaceId = req.params.id;
  const userId = req.user.id;

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) return res.status(404).json({ message: 'Workspace membership not found' });

    if (isWorkspaceAdmin(member)) {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: { in: WORKSPACE_ADMIN_ROLES } },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'You are the last workspace Admin. Assign another Admin before leaving.',
        });
      }
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    return res.status(200).json({ message: 'You left the workspace successfully' });
  } catch (error) {
    console.error(`Leave workspace error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error leaving workspace' });
  }
};

// ─── Invite a Member ────────────────────────────────────────────────────────
// @route  POST /api/workspaces/:id/invitations
// @access Owner | Admin
const inviteMember = async (req, res) => {
  const workspaceId = req.params.id;
  const { email, role } = req.body;
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // If the email already belongs to a member, there is nothing to invite.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const alreadyMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (alreadyMember) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: { email: 'This user is already a member of the workspace.' },
        });
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role: role || 'Collaborator',
        tokenHash: hashToken(rawToken),
        invitedBy: req.user.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept?token=${rawToken}`;
    try {
      await emailService.sendInvitationEmail({
        to: email,
        workspaceName: workspace.name,
        inviterName: req.user.name,
        acceptUrl,
      });
    } catch (emailError) {
      console.error(`[EmailService] Invitation email delivery failed: ${emailError.message}`);
    }

    // The raw token is returned only outside production to ease testing.
    const response = { invitation: { id: invitation.id, email, role: invitation.role, status: invitation.status } };
    if (process.env.NODE_ENV !== 'production') response.acceptToken = rawToken;
    return res.status(201).json(response);
  } catch (error) {
    console.error(`Invite member error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error sending invitation' });
  }
};

// ─── Verify an Invitation (Public) ──────────────────────────────────────────
// @route  GET /api/workspaces/invitations/verify
// @access Public
const verifyInvitation = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token is required' });

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { workspace: true },
    });
    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation is invalid or has already been used.' });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This invitation has expired.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });

    return res.status(200).json({
      valid: true,
      email: invitation.email,
      workspaceName: invitation.workspace.name,
      existingUser: !!existingUser,
    });
  } catch (error) {
    console.error(`Verify invitation error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error verifying invitation' });
  }
};

// ─── Accept an Invitation ───────────────────────────────────────────────────
// @route  POST /api/workspaces/invitations/accept
// @access Any authenticated user (must match the invited email)
const acceptInvitation = async (req, res) => {
  const { token } = req.body;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation is invalid or has already been used.' });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This invitation has expired.' });
    }
    if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation was issued to a different email address.' });
    }

    await prisma.$transaction([
      prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: req.user.id } },
        create: { workspaceId: invitation.workspaceId, userId: req.user.id, role: invitation.role },
        update: {},
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
    ]);

    return res.status(200).json({ message: 'Invitation accepted', workspaceId: invitation.workspaceId });
  } catch (error) {
    console.error(`Accept invitation error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error accepting invitation' });
  }
};

module.exports = {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  listMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  inviteMember,
  verifyInvitation,
  acceptInvitation,
};
