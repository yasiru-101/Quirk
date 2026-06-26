const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../config/db');
const { resolveProjectAccess } = require('../middleware/membership');

// Initialize Gemini SDK
// Requires GEMINI_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define tools (functions) the AI can call
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_tasks',
        description: 'Fetch tasks for the current project or workspace.',
        parameters: {
          type: 'OBJECT',
          properties: {
            status: {
              type: 'STRING',
              description: 'Optional task status filter (e.g. "todo", "in_progress", "done").',
            },
            priority: {
              type: 'STRING',
              description: 'Optional priority filter (e.g. "High", "Urgent").',
            }
          },
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task in the current project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'The title of the task.',
            },
            description: {
              type: 'STRING',
              description: 'Optional detailed description of the task.',
            },
            priority: {
              type: 'STRING',
              description: 'Task priority (Low, Medium, High, Urgent). Defaults to Medium.',
            }
          },
          required: ['title'],
        },
      }
    ],
  },
];

exports.handleChat = async (req, res, next) => {
  try {
    const { message, workspaceId, projectId } = req.body;
    
    if (!message) {
      return res.status(400).json({ errorCode: 400, message: 'Message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ errorCode: 500, message: 'AI Assistant is not configured. Missing API key.' });
    }

    // Security Guard: Validate access to the requested context
    if (projectId) {
        const access = await resolveProjectAccess(req.user, projectId, []);
        if (!access.ok) {
            return res.status(403).json({ errorCode: 403, message: 'Access denied to project context.' });
        }
    } else if (workspaceId) {
        // Simple membership check for workspace
        const membership = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: req.user.id } }
        });
        if (!membership) {
            return res.status(403).json({ errorCode: 403, message: 'Access denied to workspace context.' });
        }
    } else {
        return res.status(400).json({ errorCode: 400, message: 'Either workspaceId or projectId context is required.' });
    }

    const model = genAI.getGenerativeModel({
        // gemini-1.5-flash is retired for API keys created in 2025+; gemini-2.0-flash
        // is the current GA free-tier model that supports function calling.
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        tools: tools,
        systemInstruction: `You are Quirk AI, a helpful, concise assistant for a task management SaaS. 
        You help users manage their tasks.
        When asked to create a task, use the create_task function.
        When asked about tasks, use the get_tasks function.
        If a tool call fails, inform the user gently. Keep responses short and professional.`,
    });

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: "Hello" }] },
            { role: "model", parts: [{ text: "Hi! I am Quirk AI. How can I help you manage your tasks today?" }] }
        ]
    });

    // Send the user's message
    const result = await chat.sendMessage(message);
    let responseText = "";
    
    // Check if the model decided to call a function
    const functionCalls = result.response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        
        if (call.name === 'create_task') {
            if (!projectId) {
                responseText = "I can only create tasks when you are viewing a specific project.";
            } else {
                try {
                    const task = await prisma.task.create({
                        data: {
                            title: call.args.title,
                            description: call.args.description || null,
                            priority: call.args.priority || 'Medium',
                            projectId: projectId,
                            createdBy: req.user.id,
                        }
                    });
                    
                    // Respond back to model with the result of the function call
                    const secondResult = await chat.sendMessage([{
                        functionResponse: {
                            name: 'create_task',
                            response: { status: 'success', task: task }
                        }
                    }]);
                    responseText = secondResult.response.text();
                } catch (err) {
                    console.error("Task creation failed via AI:", err);
                    responseText = "I'm sorry, I encountered an error while trying to create the task.";
                }
            }
        } else if (call.name === 'get_tasks') {
            try {
                const whereClause = { deletedAt: null };
                if (projectId) whereClause.projectId = projectId;
                else if (workspaceId) whereClause.project = { workspaceId };
                
                if (call.args.priority) whereClause.priority = call.args.priority;

                const tasks = await prisma.task.findMany({
                    where: whereClause,
                    select: { id: true, title: true, priority: true, dueDate: true, column: { select: { name: true } } },
                    take: 20 // limit to avoid token overflow
                });

                const secondResult = await chat.sendMessage([{
                    functionResponse: {
                        name: 'get_tasks',
                        response: { status: 'success', tasks: tasks }
                    }
                }]);
                responseText = secondResult.response.text();
            } catch (err) {
                console.error("Task fetch failed via AI:", err);
                responseText = "I'm sorry, I encountered an error while trying to fetch your tasks.";
            }
        }
    } else {
        // Just a normal text response
        responseText = result.response.text();
    }

    res.json({ reply: responseText });
  } catch (err) {
    console.error('AI Chat Error:', err);
    // Surface the underlying reason (e.g. Gemini auth/model errors) so failures are
    // diagnosable from the client instead of being hidden behind a generic 500.
    const detail = err && err.message ? String(err.message).replace(/\s+/g, ' ').slice(0, 300) : 'Unknown error';
    res.status(500).json({ errorCode: 500, message: `AI request failed: ${detail}` });
  }
};
