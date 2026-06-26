# 11. Task File Attachments

- Status: Accepted
- Date: 2026-06-26

## Context

Tasks require the ability to attach files directly, rather than solely through comment uploads. Prior to this change, the backend had basic support for file upload (via `CommentsPanel` integration) using Azure Blob Storage (with a local fallback), but lacked a standalone `AttachmentsPanel`, a list endpoint, and a deletion endpoint. 

## Decision

We have implemented a standalone file attachment lifecycle for Tasks:

1. **Standalone UI:** 
   - A dedicated `AttachmentsPanel` is added to `TaskDetailPage` and `TaskModal`, separating file management from the comment stream.
   - `FileUploadModal` supports drag-and-drop and manual file selection.

2. **Backend API:**
   - `GET /api/attachments/task/:taskId` retrieves all attachments for a specific task.
   - `DELETE /api/attachments/:id` removes an attachment record.
   - `getTaskById` includes `attachments` in the payload for immediate rendering on the frontend.

3. **Blob Deletion Strategy:**
   - Deleting an attachment record from the database triggers a hard deletion of the corresponding file blob from Azure Blob Storage (or local storage). This ensures storage costs are kept minimal and no orphaned files accumulate over time.

4. **Authorization & Constraints:**
   - Any user with participant access to the task can view and upload attachments.
   - Deletion is restricted to the original uploader of the attachment or a Project Manager.
   - File size is capped at 10 MB.
   - Allowed formats remain strict: PDF, DOCX, JPEG, PNG, ZIP.

## Consequences

- Improved task management by centralizing all files associated with a task in a dedicated UI.
- Clean storage architecture where deleted records automatically clean up their associated blobs.
- Storage costs are kept under control by actively deleting removed files.
