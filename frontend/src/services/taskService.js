/**
 * @file taskService.js
 * @description Service broker calling task endpoints, comment streams, and uploads.
 */
import api from './api';

export const taskService = {
  /** Get all tasks (filtered by backend RBAC scope) */
  getTasks: (params = {}) =>
    api.get('/tasks', { params }),

  /** Get a single task detail */
  getTask: (id) =>
    api.get(`/tasks/${id}`),

  /** Create a task (PM only) */
  createTask: (data) =>
    api.post('/tasks', data),

  /** Full update (PM only) */
  updateTask: (id, data) =>
    api.put(`/tasks/${id}`, data),

  /** Column-only update (PM + assigned Collaborator) */
  updateTaskColumn: (id, columnId) =>
    api.patch(`/tasks/${id}/column`, { columnId }),

  /** Delete a task (PM only) */
  deleteTask: (id) =>
    api.delete(`/tasks/${id}`),

  /** Assign users to task (PM only) */
  assignTask: (id, userIds) =>
    api.post(`/tasks/${id}/assign`, { userIds }),

  // ─── Comments ─────────────────────────────────────────────────────────────

  getComments: (taskId) =>
    api.get(`/tasks/${taskId}/comments`),

  addComment: (taskId, data) =>
    api.post(`/tasks/${taskId}/comments`, data),

  // ─── Attachments ──────────────────────────────────────────────────────────

  uploadAttachment: (formData) =>
    api.post('/attachments/upload', formData),

  getDownloadUrl: (attachmentId) =>
    api.get(`/attachments/${attachmentId}/download`),

  getTaskAttachments: (taskId) =>
    api.get(`/attachments/task/${taskId}`),

  deleteAttachment: (attachmentId) =>
    api.delete(`/attachments/${attachmentId}`),
};
