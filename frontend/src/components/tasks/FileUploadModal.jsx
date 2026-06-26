import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { taskService } from '../../services/taskService';
import { useToast } from '../../context/ToastContext';
import { ALLOWED_ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_SIZE } from '../../utils/constants';
import { formatFileSize, cn } from '../../utils/helpers';

export default function FileUploadModal({ open, onClose, taskId, onUploadSuccess }) {
  const { error: toastError } = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setFile(null);
      setStatus('idle');
      setErrorMsg('');
      setIsDragging(false);
    }
  }, [open]);

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      setErrorMsg('Unsupported file type. Allowed: PDF, DOCX, JPEG, PNG, ZIP.');
      setStatus('error');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_ATTACHMENT_SIZE) {
      setErrorMsg(`File too large. Maximum size is ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
      setStatus('error');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleUpload = async () => {
    if (!file || !taskId) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    try {
      const { data } = await taskService.uploadAttachment(formData);
      setStatus('success');
      onUploadSuccess?.(data.attachment);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Upload failed. Please try again.');
      toastError('Upload failed.');
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      open={open}
      onClose={status === 'uploading' ? () => {} : onClose}
      title="Upload File"
      size="md"
    >
      <div className="space-y-6">
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--colors-ink)]">Upload Successful</h3>
              <p className="text-sm text-[var(--colors-body)] mt-1">{file?.name} has been attached to the task.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={clearFile}>Upload Another</Button>
              <Button type="button" variant="primary" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <div 
              className={cn(
                "relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all duration-200",
                isDragging ? "border-[var(--colors-primary)] bg-[var(--colors-primary-glow)]" : "border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] hover:border-[var(--colors-mute)]",
                status === 'error' && !file && "border-red-300 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                disabled={status === 'uploading' || file !== null}
              />
              
              {!file ? (
                <div className="flex flex-col items-center text-center pointer-events-none">
                  <UploadCloud className={cn("h-10 w-10 mb-4", isDragging ? "text-[var(--colors-primary)]" : "text-[var(--colors-mute)]")} />
                  <p className="text-sm font-semibold text-[var(--colors-ink)]">
                    {isDragging ? "Drop file to upload" : "Drag & drop a file here"}
                  </p>
                  <p className="text-xs text-[var(--colors-ink-muted)] mt-1">
                    or click to browse
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--colors-ink-faint)] mt-4">
                    Max 10MB (PDF, DOCX, JPG, PNG, ZIP)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 w-full relative z-10 p-4 bg-[var(--colors-canvas)] border border-[var(--colors-hairline)] rounded-lg shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--colors-primary-glow)] text-[var(--colors-primary-deep)]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--colors-ink)] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs font-medium text-[var(--colors-mute)]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {status !== 'uploading' && (
                    <button 
                      type="button"
                      onClick={clearFile}
                      className="p-2 text-[var(--colors-mute)] hover:text-red-500 rounded-full hover:bg-[var(--colors-canvas-soft)] transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg dark:text-red-400 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--colors-hairline)]">
              <Button type="button" variant="secondary" onClick={onClose} disabled={status === 'uploading'}>
                Cancel
              </Button>
              <Button 
                type="button"
                variant="primary" 
                onClick={handleUpload} 
                disabled={!file || status === 'uploading'}
                loading={status === 'uploading'}
              >
                {status === 'uploading' ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
