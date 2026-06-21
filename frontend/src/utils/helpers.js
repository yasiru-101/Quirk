/**
 * @file helpers.js
 * @description Helper utilities (formatting, styling, validators, arrays merge).
 */
import { TASK_PRIORITY, TASK_STATUS, NOTIFICATION_TYPE } from './constants';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (date) => date && isPast(new Date(date)) && !isToday(new Date(date));

export const getDueDateLabel = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return { label: 'Due today', urgency: 'high' };
  if (isTomorrow(d)) return { label: 'Due tomorrow', urgency: 'medium' };
  if (isPast(d)) return { label: 'Overdue', urgency: 'critical' };
  return { label: formatDate(date), urgency: 'normal' };
};

// ─── Priority Helpers ─────────────────────────────────────────────────────────
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'text-[var(--colors-priority-urgent)]';
    case 'high':   return 'text-[var(--colors-priority-high)]';
    case 'medium': return 'text-[var(--colors-priority-medium)]';
    case 'low':    return 'text-[var(--colors-priority-low)]';
    default:       return 'text-[var(--colors-priority-low)]';
  }
};

// ─── Status Helpers ───────────────────────────────────────────────────────────
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'backlog':     return 'bg-[var(--colors-status-backlog-bg)] text-[var(--colors-status-backlog-text)]';
    case 'to do':       return 'bg-[var(--colors-status-todo-bg)] text-[var(--colors-status-todo-text)]';
    case 'in progress': return 'bg-[var(--colors-status-progress-bg)] text-[var(--colors-status-progress-text)]';
    case 'in review':   return 'bg-[var(--colors-status-review-bg)] text-[var(--colors-status-review-text)]';
    case 'completed':   
    case 'done':        return 'bg-[var(--colors-status-done-bg)] text-[var(--colors-status-done-text)]';
    default:            return 'bg-[var(--colors-status-todo-bg)] text-[var(--colors-status-todo-text)]';
  }
};

// ─── Notification Icon Helper ─────────────────────────────────────────────────
export const getNotificationMeta = (type) => {
  switch (type) {
    case NOTIFICATION_TYPE.ASSIGNMENT:    return { icon: '👤', label: 'Assigned', color: 'text-indigo-400' };
    case NOTIFICATION_TYPE.STATUS_CHANGE: return { icon: '🔄', label: 'Status Update', color: 'text-amber-400' };
    case NOTIFICATION_TYPE.COMMENT:       return { icon: '💬', label: 'Comment', color: 'text-sky-400' };
    case NOTIFICATION_TYPE.DEADLINE:      return { icon: '⏰', label: 'Deadline', color: 'text-rose-400' };
    case NOTIFICATION_TYPE.ADMIN:         return { icon: '🛡️', label: 'Admin', color: 'text-violet-400' };
    default: return { icon: '📢', label: 'Notification', color: 'text-zinc-400' };
  }
};

// ─── User Initials Avatar ─────────────────────────────────────────────────────
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
};

// ─── Password Validation ──────────────────────────────────────────────────────
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('At least one special character (!@#$%^&*)');
  return errors;
};

// ─── Role Badge Color ─────────────────────────────────────────────────────────
export const getRoleBadgeStyle = (role) => {
  switch (role) {
    case 'Admin':            return 'text-violet-400 bg-violet-400/10 ring-violet-400/20';
    case 'Project Manager':  return 'text-indigo-400 bg-indigo-400/10 ring-indigo-400/20';
    case 'Collaborator':     return 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 ring-zinc-400/20';
  }
};

// ─── Class Name Merge (lightweight clsx) ─────────────────────────────────────
export const cn = (...classes) => classes.filter(Boolean).join(' ');
