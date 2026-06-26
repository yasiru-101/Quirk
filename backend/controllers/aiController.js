const prisma = require('../config/db');
const { resolveProjectAccess } = require('../middleware/membership');
const { runAssistant, isConfigured } = require('../services/ai');

// Keep only the most recent turns to bound token usage. Each turn is one
// {role, content} entry.
const MAX_HISTORY = 10;

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
}

exports.handleChat = async (req, res) => {
  try {
    const { message, workspaceId, projectId, history } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ errorCode: 400, message: 'Message is required.' });
    }

    if (!isConfigured()) {
      return res.status(503).json({ errorCode: 503, message: 'AI Assistant is not configured.' });
    }

    // Context guard: the user may only point the assistant at a workspace or
    // project they belong to. Per-action permissions (e.g. who may create a
    // task) are enforced inside the tools themselves.
    if (projectId) {
      const access = await resolveProjectAccess(req.user, projectId, []);
      if (!access.ok) {
        return res.status(403).json({ errorCode: 403, message: 'Access denied to project context.' });
      }
    } else if (workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: req.user.id } },
      });
      if (!membership) {
        return res.status(403).json({ errorCode: 403, message: 'Access denied to workspace context.' });
      }
    } else {
      return res.status(400).json({ errorCode: 400, message: 'Either workspaceId or projectId context is required.' });
    }

    const { reply, provider } = await runAssistant({
      message: String(message),
      history: sanitizeHistory(history),
      ctx: { user: req.user, projectId, workspaceId },
    });

    return res.json({ reply, provider });
  } catch (err) {
    console.error('AI Chat Error:', err);
    if (err.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ errorCode: 503, message: 'AI Assistant is not configured.' });
    }
    // Surface the underlying reason so failures are diagnosable from the client.
    const detail = err && err.message ? String(err.message).replace(/\s+/g, ' ').slice(0, 300) : 'Unknown error';
    return res.status(500).json({ errorCode: 500, message: `AI request failed: ${detail}` });
  }
};
