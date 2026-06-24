/**
 * @file MessageThread.jsx
 * @description Scrollable message thread for the active conversation. Groups
 * consecutive messages from the same sender, inserts day dividers, and uses the
 * shared dark-surface design tokens (no ad-hoc palette).
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getInitials } from '../../utils/helpers';

function formatTimestamp(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

function Avatar({ user }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
      {getInitials(user?.name ?? '?')}
    </div>
  );
}

function DayDivider({ label }) {
  return (
    <div className="my-2 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function MessageBubble({ message, isOwn, showHeader, onDelete }) {
  const isDeleted = !!message.deletedAt;
  return (
    <div className={`group flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (showHeader ? <Avatar user={message.sender} /> : <div className="w-8 flex-shrink-0" />)}
      <div className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && showHeader && (
          <span className="mb-1 ml-1 text-[11px] font-medium text-white/55">{message.sender?.name}</span>
        )}
        <div
          className={`relative break-words rounded-[1.25rem] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
            isOwn
              ? 'rounded-tr-sm bg-[var(--colors-primary)] font-medium text-[var(--colors-surface-dark)]'
              : 'rounded-tl-sm border border-white/5 bg-[var(--colors-surface-dark-elevated)] text-white'
          } ${isDeleted ? 'italic opacity-50' : ''}`}
        >
          {message.content}
          {isOwn && !isDeleted && (
            <button
              onClick={() => onDelete(message.id)}
              id={`delete-msg-${message.id}`}
              className="absolute -left-8 -top-1.5 rounded-full bg-white/10 p-1.5 text-white/40 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
              title="Delete message"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <span className="mx-1.5 mt-1 text-[10px] text-white/40">{formatTimestamp(message.createdAt)}</span>
      </div>
    </div>
  );
}

export default function MessageThread() {
  const { user } = useAuth();
  const { messages, loadingMessages, hasMore, loadMore, deleteMessage, activeConversationId } = useChat();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!loadingMessages) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeConversationId, loadingMessages]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop < 60 && hasMore && !loadingMessages) {
      loadMore();
    }
  }, [hasMore, loadingMessages, loadMore]);

  const handleDelete = useCallback(
    async (messageId) => {
      if (!activeConversationId) return;
      if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
      await deleteMessage(activeConversationId, messageId);
    },
    [activeConversationId, deleteMessage]
  );

  if (!activeConversationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-white/50">Select a conversation to start messaging</p>
      </div>
    );
  }

  if (loadingMessages && !messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--colors-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {loadingMessages && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--colors-primary)] border-t-transparent" />
        </div>
      )}
      {hasMore && !loadingMessages && (
        <button
          onClick={loadMore}
          className="self-center text-xs text-[var(--colors-primary)] opacity-70 transition-opacity hover:underline hover:opacity-100"
        >
          Load older messages
        </button>
      )}

      {messages.map((msg, idx) => {
        const prev = messages[idx - 1];
        const newDay = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
        const sameSenderRecent =
          prev &&
          !newDay &&
          prev.senderId === msg.senderId &&
          new Date(msg.createdAt) - new Date(prev.createdAt) < 2 * 60 * 1000;
        return (
          <React.Fragment key={msg.id}>
            {newDay && <DayDivider label={dayLabel(msg.createdAt)} />}
            <MessageBubble
              message={msg}
              isOwn={msg.senderId === user?.id}
              showHeader={!sameSenderRecent}
              onDelete={handleDelete}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
