/**
 * @file ConversationList.jsx
 * @description Left panel listing all conversations with latest-message previews.
 */
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationAvatar({ conversation, currentUserId }) {
  if (conversation.type === 'PROJECT') {
    const letter = (conversation.project?.name ?? 'P')[0].toUpperCase();
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--colors-primary)] to-emerald-700 flex items-center justify-center text-[#0C120E] font-bold text-sm flex-shrink-0">
        {letter}
      </div>
    );
  }
  // DIRECT: show the other participant's avatar/initials
  const other = (conversation.participants ?? []).find((p) => (p._id || p.id) !== currentUserId);
  if (other?.avatarUrl) {
    return <img src={other.avatarUrl} alt={other.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)] font-bold text-sm flex-shrink-0">
      {getInitials(other?.name ?? '?')}
    </div>
  );
}

function conversationLabel(conversation, currentUserId) {
  if (conversation.type === 'PROJECT') {
    return conversation.project?.name ?? 'Project';
  }
  const other = (conversation.participants ?? []).find((p) => (p._id || p.id) !== currentUserId);
  return other?.name ?? 'Direct Message';
}

export default function ConversationList() {
  const { user } = useAuth();
  const { conversations, loadingConversations, activeConversationId, openConversation } = useChat();

  if (loadingConversations) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[var(--colors-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <svg className="w-10 h-10 text-[var(--colors-mute)] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm text-[var(--colors-mute)]">No conversations yet</p>
        <p className="text-xs text-[var(--colors-mute)] opacity-70">Open a project to start chatting</p>
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isActive = conv.id === activeConversationId;
        const currentUserId = user?._id || user?.id;
        const label = conversationLabel(conv, currentUserId);
        const preview = conv.latestMessage;
        return (
          <li key={conv.id}>
            <button
              id={`conv-item-${conv.id}`}
              onClick={() => openConversation(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                isActive
                  ? 'bg-[var(--colors-primary-glow)] border-l-2 border-[var(--colors-primary)]'
                  : 'hover:bg-[var(--colors-surface-hover)] border-l-2 border-transparent'
              }`}
            >
              <ConversationAvatar conversation={conv} currentUserId={currentUserId} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[var(--colors-ink)] truncate">{label}</span>
                  {preview && (
                    <span className="text-[10px] text-[var(--colors-mute)] flex-shrink-0">
                      {formatTime(preview.createdAt)}
                    </span>
                  )}
                </div>
                {preview && (
                  <p className="text-[12px] text-[var(--colors-mute)] truncate mt-0.5">
                    {preview.deletedAt ? '[deleted]' : `${preview.sender?.name?.split(' ')[0]}: ${preview.content}`}
                  </p>
                )}
                {conv.type === 'PROJECT' && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--colors-primary-glow)] text-[var(--colors-primary)] font-medium">
                    Project
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
