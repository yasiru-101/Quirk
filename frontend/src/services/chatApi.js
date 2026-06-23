/**
 * @file chatApi.js
 * @description Axios helpers for the chat and direct-message REST endpoints.
 */
import api from './api';

// ─── Conversations ────────────────────────────────────────────────────────────

/** Returns all conversations the authenticated user participates in. */
export const listConversations = () => api.get('/chat/conversations');

/**
 * Opens or retrieves the group conversation for a project.
 * @param {string} projectId UUID
 */
export const getOrCreateProjectConversation = (projectId) =>
  api.post(`/chat/conversations/project/${projectId}`);

/**
 * Opens or retrieves a direct-message conversation.
 * @param {string} targetUserId UUID of the other party
 * @param {string} workspaceId  UUID of the shared workspace
 */
export const getOrCreateDmConversation = (targetUserId, workspaceId) =>
  api.post('/chat/conversations/dm', { targetUserId, workspaceId });

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Fetches paginated message history (newest-to-cursor, returned oldest-first).
 * @param {string} conversationId UUID
 * @param {{ before?: string, limit?: number }} params
 */
export const getMessages = (conversationId, params = {}) =>
  api.get(`/chat/conversations/${conversationId}/messages`, { params });

/**
 * Posts a new message to the conversation.
 * @param {string} conversationId UUID
 * @param {string} content
 */
export const sendMessage = (conversationId, content) =>
  api.post(`/chat/conversations/${conversationId}/messages`, { content });

/**
 * Soft-deletes a message authored by the current user.
 * @param {string} conversationId UUID
 * @param {string} messageId UUID
 */
export const deleteMessage = (conversationId, messageId) =>
  api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`);
