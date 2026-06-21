/**
 * @file CommentsPanel.jsx
 * @description Feed component that handles task commentary and document uploads.
 */
import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatRelativeTime } from '../../utils/helpers';
import Input from '../common/Input';
import Button from '../common/Button';

export default function CommentsPanel({ taskId }) {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    setLoading(true);
    taskService
      .getComments(taskId)
      .then(({ data }) => setComments(data.comments ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const { data } = await taskService.addComment(taskId, { content: text.trim() });
      setComments((prev) => [...prev, data.comment]);
      setText('');
      setFile(null);
    } catch (err) {
      toastError('Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-[var(--typography-body-md-strong)] font-bold text-[var(--colors-ink)] flex items-center gap-3">
        <span>💬</span> Comments
        <span className="text-[10px] font-bold text-[var(--colors-ink)] bg-[var(--colors-canvas-softer)] border border-[var(--colors-hairline)] px-2 py-0.5 rounded-full shadow-sm">
          {comments.length}
        </span>
      </h3>

      {/* Comment list */}
      <div className="space-y-5">
        {loading ? (
          [1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-16 rounded-xl" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[var(--colors-hairline)] rounded-[var(--radius-xl)] bg-[var(--colors-canvas-softer)]">
            <span className="text-2xl mb-2 inline-block">📭</span>
            <p className="text-sm font-medium text-[var(--colors-body)]">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--colors-primary-glow)] text-[var(--colors-primary-deep)] flex items-center justify-center text-[11px] font-bold flex-shrink-0 ring-1 ring-[var(--colors-primary)]">
                {getInitials(c.user?.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xs font-bold text-[var(--colors-ink)]">{c.user?.name}</span>
                  <span className="text-[10px] font-medium text-[var(--colors-mute)]">{formatRelativeTime(c.createdAt)}</span>
                </div>
                <div className="text-sm text-[var(--colors-ink)] bg-[var(--colors-canvas-softer)] border border-[var(--colors-hairline)] rounded-[var(--radius-lg)] rounded-tl-sm px-4 py-3 leading-relaxed shadow-sm">
                  {c.content}
                </div>
                {c.attachments?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.attachments.map((a) => (
                      <a
                        key={a._id}
                        href={a.blobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[var(--colors-primary-deep)] hover:text-[var(--colors-ink)] bg-[var(--colors-primary-glow)] px-3 py-1.5 rounded-full transition-colors border border-[var(--colors-primary)]"
                      >
                        📎 {a.originalName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose area */}
      <div className="border-t border-[var(--colors-hairline)] pt-6 mt-4">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-[var(--colors-canvas-softer)] text-[var(--colors-ink)] flex items-center justify-center text-[11px] font-bold flex-shrink-0 border border-[var(--colors-hairline)] mt-1">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 space-y-3">
            <Input
              type="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
              }}
              placeholder="Add a comment… (Ctrl+Enter to send)"
              rows={3}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--colors-mute)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer uppercase tracking-widest px-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                {file ? file.name : 'Attach file'}
                <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} />
              </label>

              <Button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                variant="primary"
                loading={posting}
                className="h-9 px-5 text-xs shadow-sm"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
