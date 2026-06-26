/**
 * @file constants.js
 * @description Application configuration tokens (enums, socket urls, rules, intervals).
 */
// ─── Role Constants ──────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  COLLABORATOR: 'Collaborator',
};

// ─── Task Priority Constants ──────────────────────────────────────────────────
export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const TASK_PRIORITY_LIST = [
  TASK_PRIORITY.URGENT,
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.LOW,
];

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPE = {
  ASSIGNMENT: 'Assignment',
  COLUMN_CHANGE: 'ColumnChange',
  COMMENT: 'Comment',
  DEADLINE: 'Deadline',
  ADMIN: 'Admin',
};

// ─── API Base URL ─────────────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Socket URL ───────────────────────────────────────────────────────────────
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

// ─── Password Policy ──────────────────────────────────────────────────────────
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
  HINT: 'Min 8 chars, uppercase, lowercase, number, and special character (@$!%*?&#)',
};

// ─── Toast Durations (ms) ─────────────────────────────────────────────────────
export const TOAST_DURATION = {
  SUCCESS: 3500,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
};
