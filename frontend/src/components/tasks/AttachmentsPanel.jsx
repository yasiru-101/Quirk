import React, { useState, useEffect } from 'react';
import { Paperclip, FileText, Trash2, Plus } from 'lucide-react';
import Button from '../common/Button';
import FileUploadModal from './FileUploadModal';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { resolveAttachmentHref, formatFileSize, formatRelativeTime } from '../../utils/helpers';

const EMPTY_ARRAY = [];

export default function AttachmentsPanel({ taskId, initialAttachments, canManageTask = false }) {
  const { user } = useAuth();
  const { error: toastError, success } = useToast();
  const confirm = useConfirm();
  
  const [attachments, setAttachments] = useState(initialAttachments || EMPTY_ARRAY);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    if (initialAttachments !== undefined) {
      setAttachments(initialAttachments);
    } else if (taskId) {
      let isMounted = true;
      setLoading(true);
      taskService.getTaskAttachments(taskId)
        .then(res => {
          if (isMounted) setAttachments(res.data.attachments || EMPTY_ARRAY);
        })
        .catch(err => {
          console.error('Failed to load attachments:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      
      return () => { isMounted = false; };
    }
  }, [taskId, initialAttachments]);

  const handleDelete = async (attachmentId) => {
    const ok = await confirm({
      title: 'Delete Attachment',
      message: 'Are you sure you want to delete this file? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    try {
      await taskService.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId && a._id !== attachmentId));
      success('Attachment deleted successfully');
    } catch (err) {
      toastError('Failed to delete attachment.');
    }
  };

  const handleUploadSuccess = (newAttachment) => {
    setAttachments((prev) => [newAttachment, ...prev]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[length:var(--typography-body-md)] font-bold text-[var(--colors-ink)]">
          <Paperclip className="h-4 w-4" />
          Attachments
          <span className="text-[10px] font-bold text-[var(--colors-ink)] bg-[var(--colors-canvas-softer)] border border-[var(--colors-hairline)] px-2 py-0.5 rounded-full shadow-sm">
            {attachments.length}
          </span>
        </h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => setUploadModalOpen(true)} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add File
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-[var(--colors-canvas-soft)]" />
        ) : attachments.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[var(--colors-hairline)] rounded-[var(--radius-xl)] bg-[var(--colors-canvas-softer)]">
            <p className="text-sm font-medium text-[var(--colors-body)]">No files attached yet.</p>
          </div>
        ) : (
          attachments.map((a) => {
            const uploaderId = a.uploadedBy || a.uploader?.id;
            const canDelete = uploaderId === user?.id || canManageTask;
            const key = a.id || a._id;
            
            return (
              <div 
                key={key} 
                className="group flex items-center justify-between p-3 bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded-xl hover:border-[var(--colors-primary)] transition-colors shadow-sm"
              >
                <a
                  href={resolveAttachmentHref(a.downloadUrl || a.blobUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center gap-3 min-w-0 pr-4"
                  title="Click to download"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--colors-primary-glow)] text-[var(--colors-primary-deep)] shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--colors-ink)] truncate hover:underline underline-offset-2">
                      {a.originalName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[var(--colors-mute)] font-medium">
                      <span>{formatFileSize(a.sizeBytes)}</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--colors-hairline)]" />
                      <span>{a.uploader?.name || 'Unknown'}</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--colors-hairline)]" />
                      <span>{formatRelativeTime(a.createdAt)}</span>
                    </div>
                  </div>
                </a>
                
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(key)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[var(--colors-mute)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all focus:opacity-100 shrink-0"
                    aria-label="Delete attachment"
                    title="Delete attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <FileUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        taskId={taskId}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
