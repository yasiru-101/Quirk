/**
 * @file CommentsPanel.jsx
 * @description Feed component that handles task commentary and document uploads.
 */
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { API_BASE_URL } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatRelativeTime } from '../../utils/helpers';
import Input from '../common/Input';
import Button from '../common/Button';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip'];

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const resolveAttachmentHref = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const apiOrigin = /^https?:\/\//i.test(API_BASE_URL)
    ? new URL(API_BASE_URL).origin
    : window.location.origin;

  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function CommentsPanel({ taskId }) {
  const { user } = useAuth();
  const { error: toastError, success } = useToast();
  const fileInputRef = useRef(null);
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

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      event.target.value = '';
      setFile(null);
      toastError('Unsupported file type. Allowed: PDF, DOC, DOCX, JPEG, PNG, ZIP.');
      return;
    }

    if (selected.size > MAX_ATTACHMENT_SIZE) {
      event.target.value = '';
      setFile(null);
      toastError('File must be 10 MB or smaller.');
      return;
    }

    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
      clearFile();
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
                        href={resolveAttachmentHref(a.downloadUrl || a.blobUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-2 rounded-md border border-[var(--colors-primary)] bg-[var(--colors-primary-glow)] px-3 py-1.5 text-[11px] font-bold text-[var(--colors-primary-deep)] transition-colors hover:text-[var(--colors-ink)]"
                        title={a.originalName}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="max-w-[220px] truncate">{a.originalName}</span>
                        {a.sizeBytes ? (
                          <span className="shrink-0 font-medium text-[var(--colors-ink-muted)]">
                            {formatFileSize(a.sizeBytes)}
                          </span>
                        ) : null}
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
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                    onChange={handleFileChange}
                  />
                </label>
                {file && (
                  <span className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--colors-primary)] bg-[var(--colors-primary-glow)] px-2.5 py-1 text-[11px] font-medium text-[var(--colors-ink-muted)]">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--colors-primary-deep)]" />
                    <span className="max-w-[180px] truncate text-[var(--colors-ink)]">{file.name}</span>
                    <span className="shrink-0">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="ml-0.5 shrink-0 text-[var(--colors-mute)] hover:text-[var(--colors-priority-urgent)] transition-colors"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
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
