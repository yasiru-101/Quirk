/**
 * @file MessageInput.jsx
 * @description Text input and send controls for composing chat messages, with
 * @mention autocomplete against the active conversation's participants.
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

// Locate an in-progress "@mention" token ending at the caret. A token starts at an
// "@" that sits at the start of the line or right after whitespace, so emails and
// mid-word "@" don't trigger it. Returns { start, query } or null.
function detectMention(value, caret) {
  const upto = value.slice(0, caret);
  for (let i = upto.length - 1; i >= 0; i--) {
    const ch = upto[i];
    if (ch === '\n') return null;
    if (ch === '@') {
      const prev = i === 0 ? ' ' : upto[i - 1];
      if (!/\s/.test(prev)) return null;
      const query = upto.slice(i + 1);
      if (query.length > 30) return null;
      return { start: i, query };
    }
  }
  return null;
}

export default function MessageInput() {
  const { sendMessage, activeConversationId, conversations } = useChat();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [mention, setMention] = useState(null); // { start, query }
  const [activeIdx, setActiveIdx] = useState(0);
  const textareaRef = useRef(null);

  const currentUserId = user?._id || user?.id;
  const participants = useMemo(() => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    return (conv?.participants ?? []).filter((p) => (p._id || p.id) !== currentUserId && p.name);
  }, [conversations, activeConversationId, currentUserId]);

  const suggestions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return participants
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mention, participants]);

  const showSuggestions = !!mention && suggestions.length > 0;

  const syncMention = (value, caret) => {
    const next = detectMention(value, caret);
    setMention(next);
    setActiveIdx(0);
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    syncMention(e.target.value, e.target.selectionStart);
  };

  const applyMention = (member) => {
    if (!mention) return;
    const caret = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, mention.start);
    const after = content.slice(caret);
    const inserted = `@${member.name} `;
    const next = `${before}${inserted}${after}`;
    setContent(next);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || !activeConversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(activeConversationId, trimmed);
      setContent('');
      setMention(null);
      textareaRef.current?.focus();
    } catch (err) {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }, [content, activeConversationId, sending, sendMessage]);

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyMention(suggestions[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const disabled = !activeConversationId;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-[var(--colors-hairline)]">
      {error && (
        <p className="text-xs text-[var(--colors-priority-urgent)] mb-1.5 px-1">{error}</p>
      )}
      <div className="relative">
        {showSuggestions && (
          <div className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-elevated)] py-1 shadow-[var(--shadow-floating)] z-30">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--colors-mute)]">Mention</p>
            {suggestions.map((member, idx) => (
              <button
                key={member._id || member.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applyMention(member); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  idx === activeIdx ? 'bg-[var(--colors-canvas-soft)]' : ''
                }`}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--colors-surface-pressed)] text-[10px] font-bold text-[var(--colors-ink)]">
                  {getInitials(member.name)}
                </span>
                <span className="truncate text-sm font-medium text-[var(--colors-ink)]">{member.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-end gap-2 bg-[var(--colors-surface)] border rounded-2xl px-3 py-2 transition-all ${
          disabled ? 'opacity-40 cursor-not-allowed border-[var(--colors-hairline)]' : 'border-[var(--colors-hairline-mid)] focus-within:border-[var(--colors-primary)] focus-within:shadow-md'
        }`}>
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={(e) => syncMention(content, e.target.selectionStart)}
            disabled={disabled}
            placeholder={disabled ? 'Select a conversation' : 'Type a message — use @ to mention someone'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[var(--colors-ink)] placeholder-[var(--colors-mute)] outline-none resize-none max-h-32 overflow-y-auto leading-relaxed"
            style={{ minHeight: '24px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            id="chat-send-button"
            onClick={handleSend}
            disabled={disabled || !content.trim() || sending}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-[var(--colors-primary)] text-white hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:brightness-100"
            title="Send message"
          >
            {sending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[var(--colors-mute)] mt-1.5 px-1">
        Enter to send. Shift+Enter for new line. Type @ to mention.
      </p>
    </div>
  );
}
