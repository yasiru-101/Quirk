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
  const { error: toastError, success } = useToast();
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
      let newComment = data.comment;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);
        formData.append('commentId', newComment._id);
        try {
          const { data: uploadData } = await taskService.uploadAttachment(formData);
          newComment = { ...newComment, attachments: [uploadData.attachment] };
          success('Comment posted with attachment');
        } catch {
          toastError('Comment posted, but file upload failed.');
        }
      } else {
        success('Comment posted');
      }

      setComments((prev) => [...prev, newComment]);
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
      <h3 className="flex items-center gap-3 text-[length:var(--typography-body-md)] font-bold text-[var(--colors-ink)]">
        Comments
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
            <p className="text-sm font-medium text-[var(--colors-body)]">No comments yet. Start the conversation.</p>
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
                        {a.originalName}
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
              placeholder="Add a comment (Ctrl+Enter to send)"
              rows={3}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--colors-mute)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer uppercase tracking-widest px-2 py-1 rounded-md hover:bg-[var(--colors-surface-pressed)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Attach
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                    onChange={(e) => setFile(e.target.files[0] ?? null)}
                  />
                </label>
                {file && (
                  <span className="flex items-center gap-1 min-w-0 rounded-full border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--colors-ink-muted)]">
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="ml-0.5 shrink-0 text-[var(--colors-mute)] hover:text-[var(--colors-priority-urgent)] transition-colors"
                      aria-label="Remove attachment"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </span>
                )}
              </div>

              <Button
                type="button"
                onClick={handlePost}
                disabled={!text.trim() || posting}
                variant="primary"
                loading={posting}
                className="shrink-0 h-9 px-5 text-xs shadow-sm"
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
