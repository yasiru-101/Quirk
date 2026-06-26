/**
 * @file services/ai/index.js
 * @description AI assistant orchestrator. Runs the configured providers in
 * priority order (Gemini first, then Groq) and automatically falls back to the
 * next provider when one is rate-limited or unavailable. Tool definitions and
 * execution (with RBAC) are shared across providers.
 */

const { toolSpecs, executeTool } = require('./tools');
const geminiProvider = require('./geminiProvider');
const groqProvider = require('./groqProvider');

const PROVIDERS = [geminiProvider, groqProvider];

const BASE_SYSTEM_PROMPT = `You are Quirk AI, the assistant built into the Quirk task-management app.
- Be concise, friendly, and professional. Prefer short answers.
- Use the provided tools to read or create tasks instead of guessing or inventing data.
- Only state that a task was created if the create_task tool returned status "success".
- If a tool returns an error or a permission denial, relay that plainly to the user and do not pretend the action succeeded.
- You can only see the user's current workspace/project; you cannot access other workspaces.
- When listing tasks, summarize them clearly (title, status, priority, and due date when present).
- Tasks have due dates. You can set a due date when creating a task, and you can sort or filter tasks by due date with get_tasks. Convert relative dates the user mentions (e.g. "tomorrow", "next Friday") to an ISO date (YYYY-MM-DD) using today's date before calling a tool.`;

function buildSystemPrompt() {
  return `${BASE_SYSTEM_PROMPT}\nToday's date is ${new Date().toISOString().slice(0, 10)}.`;
}

/** Errors worth falling back to the next provider for (transport/quota/server). */
function shouldFallback(err) {
  const status = err && err.status;
  if (status && [408, 409, 429, 500, 502, 503, 504, 529].includes(status)) return true;
  const msg = (err && err.message ? err.message : '').toLowerCase();
  return /quota|rate limit|exceeded|overloaded|temporarily|timeout|fetch failed|network|econn|unavailable|limit: 0|api key not valid|invalid api key/.test(msg);
}

function isConfigured() {
  return PROVIDERS.some((p) => p.isConfigured());
}

/**
 * @param {{ message: string, history?: Array<{role:string,content:string}>,
 *           ctx: { user: object, projectId?: string, workspaceId?: string } }} opts
 * @returns {Promise<{ reply: string, provider: string }>}
 */
async function runAssistant({ message, history = [], ctx }) {
  const active = PROVIDERS.filter((p) => p.isConfigured());
  if (active.length === 0) {
    const err = new Error('AI assistant is not configured. No provider API key is set.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  let lastErr;
  for (let i = 0; i < active.length; i += 1) {
    const provider = active[i];
    try {
      const reply = await provider.chat({
        system: buildSystemPrompt(),
        message,
        history,
        toolSpecs,
        executeTool,
        ctx,
      });
      return { reply, provider: provider.name };
    } catch (err) {
      lastErr = err;
      const hasNext = i < active.length - 1;
      if (hasNext && shouldFallback(err)) {
        console.warn(`AI provider "${provider.name}" failed (${err.message}); falling back to "${active[i + 1].name}".`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

module.exports = { runAssistant, isConfigured };
