/**
 * @file NotificationBell.jsx
 * @description Floating notification bell icon with socket-driven dynamic badges.
 */
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';

/**
 * Bell icon with unread count badge. Fetches count on mount and
 * increments on incoming socket 'notification' events.
 */
/**
 * Action button rendering the unread counts. Subscribes to backend socket messages 
 * to trigger UI alerts in real time.
 *
 * @param {Function} props.onClick - Event handler that opens notification drawer
 */
export default function NotificationBell({ onClick }) {
  const [unread, setUnread] = useState(0);
  const [pulsing, setPulsing] = useState(false);
  const { on } = useSocket();

  useEffect(() => {
    notificationService
      .getNotifications()
      .then(({ data }) => {
        const count = data.notifications?.filter((n) => !n.isRead).length ?? 0;
        setUnread(count);
      })
      .catch(() => {});
  }, []);

  // Socket-driven increment
  useEffect(() => {
    const unsub = on('notification', () => {
      setUnread((n) => n + 1);
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1000);
    });
    return unsub;
  }, [on]);

  return (
    <button
      id="notification-bell-btn"
      onClick={onClick}
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-hairline transition-all focus-ring"
    >
      {/* Bell SVG */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pulsing ? 'animate-bounce' : ''}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>

      {/* Unread badge */}
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[var(--colors-primary)] text-black flex items-center justify-center text-[9px] font-bold px-1 ring-2 ring-canvas"
          style={{ animation: pulsing ? 'pulse-dot 0.5s ease' : 'none' }}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
