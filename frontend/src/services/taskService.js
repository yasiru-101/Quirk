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
    api.post('/attachments/upload', formData, {
      // Clearing Content-Type lets Axios auto-set multipart/form-data with the
      // correct boundary. Manually setting it (even to 'multipart/form-data')
      // omits the boundary and multer cannot parse the request.
      headers: { 'Content-Type': null },
    }),

  getDownloadUrl: (attachmentId) =>
    api.get(`/attachments/${attachmentId}/download`),
};
