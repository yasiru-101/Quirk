/**
 * @file services/ai/geminiProvider.js
 * @description Google Gemini adapter. Runs a bounded tool-calling loop and
 * returns the assistant's final text. Throws on transport/quota/auth errors so
 * the orchestrator can fall back to another provider.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MAX_TOOL_ROUNDS = 5;

const name = 'gemini';
const isConfigured = () => !!process.env.GEMINI_API_KEY;

// Convert neutral JSON-Schema (lowercase types) to the uppercase SchemaType
// strings the Gemini SDK expects.
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const out = { ...schema };
  if (out.type) out.type = String(out.type).toUpperCase();
  if (out.properties) {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([k, v]) => [k, toGeminiSchema(v)]),
    );
  }
  if (out.items) out.items = toGeminiSchema(out.items);
  return out;
}

function toGeminiTools(toolSpecs) {
  return [{
    functionDeclarations: toolSpecs.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: toGeminiSchema(t.parameters),
    })),
  }];
}

/**
 * @param {{ system: string, message: string, history: Array<{role:string,content:string}>,
 *           toolSpecs: Array, executeTool: Function, ctx: object }} opts
 * @returns {Promise<string>} final assistant text
 */
async function chat({ system, message, history = [], toolSpecs, executeTool, ctx }) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    tools: toGeminiTools(toolSpecs),
    systemInstruction: system,
  });

  const chatSession = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  });

  let result = await chatSession.sendMessage(message);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const calls = result.response.functionCalls();
    if (!calls || calls.length === 0) {
      return result.response.text();
    }
    const responses = [];
    for (const call of calls) {
      const output = await executeTool(call.name, call.args || {}, ctx);
      responses.push({ functionResponse: { name: call.name, response: output } });
    }
    result = await chatSession.sendMessage(responses);
  }

  return result.response.text() || 'Sorry, I could not complete that request.';
}

module.exports = { name, isConfigured, chat };
