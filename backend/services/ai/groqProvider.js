/**
 * @file services/ai/groqProvider.js
 * @description Groq adapter (OpenAI-compatible Chat Completions API). Used as an
 * automatic fallback when Gemini is rate-limited/unavailable. Uses the global
 * fetch (Node 18+) so no extra dependency is required. Throws on API errors so
 * the orchestrator can surface or fall back.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TOOL_ROUNDS = 5;

const name = 'groq';
const isConfigured = () => !!process.env.GROQ_API_KEY;

function toGroqTools(toolSpecs) {
  return toolSpecs.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

async function callGroq(messages, tools) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Groq ${res.status}: ${body.replace(/\s+/g, ' ').slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * @param {{ system: string, message: string, history: Array<{role:string,content:string}>,
 *           toolSpecs: Array, executeTool: Function, ctx: object }} opts
 * @returns {Promise<string>} final assistant text
 */
async function chat({ system, message, history = [], toolSpecs, executeTool, ctx }) {
  const tools = toGroqTools(toolSpecs);
  const messages = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: message },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const data = await callGroq(messages, tools);
    const choice = data.choices && data.choices[0];
    const msg = choice && choice.message;
    if (!msg) return 'Sorry, I could not complete that request.';

    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length) {
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch { args = {}; }
        const output = await executeTool(tc.function.name, args, ctx);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(output) });
      }
      continue;
    }

    return msg.content || 'Sorry, I could not complete that request.';
  }

  return 'Sorry, I could not complete that request.';
}

module.exports = { name, isConfigured, chat };
