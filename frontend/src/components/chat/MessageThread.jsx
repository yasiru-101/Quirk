/**
 * @file MessageThread.jsx
 * @description Scrollable message thread for the active conversation.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ user }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {getInitials(user?.name ?? '?')}
    </div>
  );
}

function MessageBubble({ message, isOwn, onDelete }) {
  const isDeleted = !!message.deletedAt;
  return (
    <div className={`flex gap-2.5 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && <Avatar user={message.sender} />}
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-[11px] text-[rgba(255,255,255,0.5)] mb-1 ml-1">{message.sender?.name}</span>
        )}
        <div
          className={`relative px-4 py-3 rounded-[1.25rem] text-[15px] leading-relaxed break-words shadow-sm ${
            isOwn
              ? 'bg-[var(--colors-primary)] text-[#0C120E] rounded-tr-sm font-medium'
              : 'bg-[#2A303A] text-white rounded-tl-sm border border-[rgba(255,255,255,0.05)]'
          } ${isDeleted ? 'italic opacity-50' : ''}`}
        >
          {message.content}
          {isOwn && !isDeleted && (
            <button
              onClick={() => onDelete(message.id)}
              id={`delete-msg-${message.id}`}
              className="absolute -top-1.5 -left-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(255,255,255,0.1)] hover:bg-red-500/20 text-[rgba(255,255,255,0.4)] hover:text-red-400 rounded-full p-1.5"
              title="Delete message"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <span className="text-[10px] text-[rgba(255,255,255,0.4)] mt-1.5 mx-1.5">
          {formatTimestamp(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// Group consecutive messages from the same sender within 2 minutes
function groupMessages(messages) {
  const groups = [];
  messages.forEach((msg, idx) => {
    const prev = messages[idx - 1];
    const sameSender = prev && prev.senderId === msg.senderId;
    const closeInTime =
      prev && new Date(msg.createdAt) - new Date(prev.createdAt) < 2 * 60 * 1000;
    if (sameSender && closeInTime) {
      groups[groups.length - 1].push(msg);
    } else {
      groups.push([msg]);
    }
  });
  return groups;
}

export default function MessageThread() {
  const { user } = useAuth();
  const { messages, loadingMessages, hasMore, loadMore, deleteMessage, activeConversationId } = useChat();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll to bottom on new messages
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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[rgba(255,255,255,0.2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-[rgba(255,255,255,0.5)] text-sm">Select a conversation to start messaging</p>
      </div>
    );
  }

  if (loadingMessages && !messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--colors-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grouped = groupMessages(messages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
    >
      {/* Load more spinner */}
      {loadingMessages && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-[var(--colors-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasMore && !loadingMessages && (
        <button
          onClick={loadMore}
          className="text-xs text-[var(--colors-primary)] hover:underline self-center opacity-70 hover:opacity-100 transition-opacity"
        >
          Load older messages
        </button>
      )}

      {grouped.map((group, gi) =>
        group.map((msg, mi) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user?.id}
            onDelete={handleDelete}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
