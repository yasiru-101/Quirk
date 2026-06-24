/**
 * @file MessageInput.jsx
 * @description Text input and send controls for composing chat messages.
 */
import React, { useState, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';

export default function MessageInput() {
  const { sendMessage, activeConversationId } = useChat();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || !activeConversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(activeConversationId, trimmed);
      setContent('');
      textareaRef.current?.focus();
    } catch (err) {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }, [content, activeConversationId, sending, sendMessage]);

  const handleKeyDown = (e) => {
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
      <div className={`flex items-end gap-2 bg-[var(--colors-surface)] border rounded-2xl px-3 py-2 transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed border-[var(--colors-hairline)]' : 'border-[var(--colors-hairline-mid)] focus-within:border-[var(--colors-primary)] focus-within:shadow-md'
      }`}>
        <textarea
          id="chat-message-input"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Select a conversation' : 'Type a message (Enter to send, Shift+Enter for new line)'}
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
      <p className="text-[10px] text-[var(--colors-mute)] mt-1.5 px-1">
        Enter to send. Shift+Enter for new line.
      </p>
    </div>
  );
}
