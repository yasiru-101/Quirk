/**
 * @file NotificationPanel.jsx
 * @description Panel sidebar overlay loading recent user notifications.
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';
import { getNotificationMeta, formatRelativeTime } from '../../utils/helpers';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

/**
 * Dialogue side container rendering notification lists. Integrates web-socket events
 * to load instant updates, and handles read-status markers.
 *
 * @param {boolean} props.open - Open state of notification pane drawer
 * @param {Function} props.onClose - Action closing notification screen
 */
export default function NotificationPanel({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const { on } = useSocket();

  // Load notifications
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationService
      .getNotifications()
      .then(({ data }) => setNotifications(data.notifications ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Real-time: prepend incoming notifications
  useEffect(() => {
    const unsub = on('notification', (incoming) => {
      setNotifications((prev) => [incoming, ...prev]);
    });
    return unsub;
  }, [on]);

  // Pending notifications on reconnect
  useEffect(() => {
    const unsub = on('pending_notifications', (batch) => {
      setNotifications((prev) => [...batch, ...prev]);
    });
    return unsub;
  }, [on]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const bell = document.getElementById('notification-bell-btn');
        if (!bell?.contains(e.target)) onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try { await notificationService.markRead(id); } catch {}
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await notificationService.markAllRead(); } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed right-4 top-[68px] z-50 w-[380px] card flex flex-col slide-up overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-lg)',
        maxHeight: '520px',
      }}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-zinc-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-2 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="All caught up!"
            description="You have no notifications right now. New ones will appear here."
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {notifications.map((n) => (
              <NotificationItem key={n._id} notification={n} onMarkRead={markRead} />
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Single Notification Item ──────────────────────────────────────────────────
function NotificationItem({ notification, onMarkRead }) {
  const { _id, type, message, isRead, createdAt } = notification;
  const meta = getNotificationMeta(type);

  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer
        ${isRead ? 'opacity-60 hover:opacity-80' : 'hover:bg-zinc-800/40'}`}
      onClick={() => !isRead && onMarkRead(_id)}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${meta.color} bg-zinc-800`}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-200 leading-relaxed">{message}</p>
        <p className="text-[10px] text-zinc-600 mt-1">{formatRelativeTime(createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!isRead && (
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1" aria-label="Unread" />
      )}
    </li>
  );
}
