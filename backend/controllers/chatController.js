/**
 * @file chatController.js
 * @description REST handlers for conversations and chat messages.
 *
 * Two conversation kinds are supported:
 *   PROJECT – one group chat per project, participants = current ProjectMembers.
 *   DIRECT  – a private thread between two users who share at least one workspace.
 *
 * Authorization:
 *   - Project conversations are guarded by the membership middleware
 *     (requireProjectRole) applied in the route file; the controller trusts that
 *     the caller is already a verified project member.
 *   - DM conversations are guarded here: both parties must share a workspace.
 *   - All message reads/writes check that req.user is a ConversationParticipant.
 */

const prisma = require('../config/db');
const { getIO } = require('../services/socketService');
const { listMessagesQuerySchema } = require('../validations/chatSchemas');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const deny = (res, status, message) =>
  res.status(status).json({ errorCode: status, message });

// Select shape used for sender info embedded in message responses.
const SENDER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
};

// Mask the content of soft-deleted messages.
const maskDeleted = (msg) =>
  msg.deletedAt ? { ...msg, content: '[deleted]' } : msg;

/**
 * Confirm that req.user is an active participant of the given conversation.
 * Returns the participant row, or null if they are not.
 */
async function getParticipant(conversationId, userId) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

// ─── List Conversations ───────────────────────────────────────────────────────
// @route  GET /api/chat/conversations
// @access Any authenticated user
const listConversations = async (req, res) => {
  try {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: req.user.id },
      include: {
        conversation: {
          include: {
            // Most recent message for preview
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: SENDER_SELECT } },
            },
            // For PROJECT conversations expose the linked project name
            project: { select: { id: true, name: true } },
            // Participants for avatar display (cap at 5)
            participants: {
              take: 5,
              include: { user: { select: SENDER_SELECT } },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const conversations = participations.map((p) => ({
      ...p.conversation,
      latestMessage: p.conversation.messages[0] ?? null,
      participants: p.conversation.participants.map((cp) => cp.user),
    }));

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error(`List conversations error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error listing conversations' });
  }
};

// ─── Get or Create Project Conversation ─────────────────────────────────────
// @route  POST /api/chat/conversations/project/:projectId
// @access ProjectMember (enforced by requireProjectRole in routes)
const getOrCreateProjectConversation = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
        workspace: { select: { id: true } },
      },
    });
    if (!project || project.deletedAt) {
      return deny(res, 404, 'Project not found.');
    }

    // Upsert: find existing or create.
    let conversation = await prisma.conversation.findUnique({
      where: { projectId },
      include: {
        participants: { include: { user: { select: SENDER_SELECT } } },
      },
    });

    if (!conversation) {
      // Seed participants from current project members.
      conversation = await prisma.$transaction(async (tx) => {
        const created = await tx.conversation.create({
          data: {
            type: 'PROJECT',
            projectId,
            workspaceId: project.workspaceId,
          },
        });
        await tx.conversationParticipant.createMany({
          data: project.members.map((m) => ({
            conversationId: created.id,
            userId: m.userId,
          })),
          skipDuplicates: true,
        });
        return tx.conversation.findUnique({
          where: { id: created.id },
          include: {
            participants: { include: { user: { select: SENDER_SELECT } } },
          },
        });
      });
    }

    return res.status(200).json({ conversation });
  } catch (error) {
    console.error(`Get/create project conversation error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Get or Create DM Conversation ─────────────────────────────────────────
// @route  POST /api/chat/conversations/dm
// @access Authenticated; both users must share a workspace
const getOrCreateDmConversation = async (req, res) => {
  const { targetUserId, workspaceId } = req.body;
  const callerId = req.user.id;

  if (targetUserId === callerId) {
    return deny(res, 400, 'You cannot start a DM with yourself.');
  }

  try {
    // Confirm both users are members of the stated workspace.
    const [callerMembership, targetMembership] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: callerId } },
      }),
      prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      }),
    ]);

    if (!callerMembership) {
      return deny(res, 403, 'You are not a member of this workspace.');
    }
    if (!targetMembership) {
      return deny(res, 403, 'The target user is not a member of this workspace.');
    }

    // Look for an existing DIRECT conversation that contains exactly these two users.
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        workspaceId,
        participants: {
          every: { userId: { in: [callerId, targetUserId] } },
        },
        AND: [
          { participants: { some: { userId: callerId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: SENDER_SELECT } } },
      },
    });

    if (existing) {
      return res.status(200).json({ conversation: existing });
    }

    // Create new DM conversation.
    const conversation = await prisma.$transaction(async (tx) => {
      const created = await tx.conversation.create({
        data: { type: 'DIRECT', workspaceId },
      });
      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: created.id, userId: callerId },
          { conversationId: created.id, userId: targetUserId },
        ],
      });
      return tx.conversation.findUnique({
        where: { id: created.id },
        include: {
          participants: { include: { user: { select: SENDER_SELECT } } },
        },
      });
    });

    return res.status(201).json({ conversation });
  } catch (error) {
    console.error(`Get/create DM conversation error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Get Message History ─────────────────────────────────────────────────────
// @route  GET /api/chat/conversations/:conversationId/messages
// @access Conversation participant
const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    // Authorization: caller must be a participant.
    const participant = await getParticipant(conversationId, req.user.id);
    if (!participant) {
      return deny(res, 403, 'You are not a participant in this conversation.');
    }

    // Parse and validate query params.
    const parseResult = listMessagesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        errorCode: 400,
        message: 'Invalid query parameters',
        errors: Object.fromEntries(
          parseResult.error.issues.map((i) => [i.path.join('.'), i.message])
        ),
      });
    }
    const { before, limit } = parseResult.data;

    // Cursor-based pagination: fetch messages older than `before`.
    let cursorClause = {};
    if (before) {
      const pivot = await prisma.chatMessage.findUnique({ where: { id: before } });
      if (pivot) {
        cursorClause = { createdAt: { lt: pivot.createdAt } };
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId, ...cursorClause },
      include: { sender: { select: SENDER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Return in ascending order (oldest first) so the client can append.
    return res.status(200).json({ messages: messages.map(maskDeleted).reverse() });
  } catch (error) {
    console.error(`Get messages error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching messages' });
  }
};

// ─── Send a Message ──────────────────────────────────────────────────────────
// @route  POST /api/chat/conversations/:conversationId/messages
// @access Conversation participant
const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body; // validated by validate(sendMessageSchema) in route

  try {
    // Authorization: caller must be a participant.
    const participant = await getParticipant(conversationId, req.user.id);
    if (!participant) {
      return deny(res, 403, 'You are not a participant in this conversation.');
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: req.user.id,
        content,
      },
      include: { sender: { select: SENDER_SELECT } },
    });

    // Deliver in real-time to everyone in the conversation room.
    const io = getIO();
    if (io) {
      io.to(`conv:${conversationId}`).emit('chat:message', message);
    }

    return res.status(201).json({ message });
  } catch (error) {
    console.error(`Send message error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error sending message' });
  }
};

// ─── Delete a Message (soft) ─────────────────────────────────────────────────
// @route  DELETE /api/chat/conversations/:conversationId/messages/:messageId
// @access Message author only
const deleteMessage = async (req, res) => {
  const { conversationId, messageId } = req.params;
  try {
    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.conversationId !== conversationId) {
      return deny(res, 404, 'Message not found.');
    }
    if (msg.senderId !== req.user.id) {
      return deny(res, 403, 'You can only delete your own messages.');
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    // Notify room members so clients can redact the message immediately.
    const io = getIO();
    if (io) {
      io.to(`conv:${conversationId}`).emit('chat:message_deleted', { messageId, conversationId });
    }

    return res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    console.error(`Delete message error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error deleting message' });
  }
};

module.exports = {
  listConversations,
  getOrCreateProjectConversation,
  getOrCreateDmConversation,
  getMessages,
  sendMessage,
  deleteMessage,
};
