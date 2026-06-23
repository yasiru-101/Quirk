# 3. Realtime chat and direct-message module

- Status: Accepted
- Date: 2026-06-23

## Context

Quirk needed an in-product messaging layer so workspace members can communicate
without leaving the tool. Two kinds of conversation are required:

- **Project room** – a group thread for every project, visible to all project
  members.
- **Direct message (DM)** – a private thread between any two users who share at
  least one workspace.

## Decision

### Data model

Three new Prisma models are introduced (`Conversation`, `ConversationParticipant`,
`ChatMessage`):

- `Conversation.type` is either `"PROJECT"` or `"DIRECT"`. A `@@unique` constraint
  on `projectId` enforces one conversation per project.
- `ConversationParticipant` is the join table that determines who may read and
  write in a conversation; it is the sole source of truth for participant
  membership.
- `ChatMessage` uses a `deletedAt` soft-delete column so thread history is never
  disrupted by a deletion.

### Authorization

- **Project conversations** are guarded by `requireProjectRole()` from
  `middleware/membership.js`; the same middleware already protects all project
  routes, so the pattern is consistent with ADR 0002.
- **DM conversations** are guarded in the controller: both parties must be
  `WorkspaceMember`s of the stated workspace. The workspace ID is a required
  parameter on the create-DM endpoint.
- **Message reads and sends** additionally verify that the caller is a
  `ConversationParticipant`, so a user cannot read or write to a conversation they
  were not added to even if they discover its UUID.

### Realtime delivery

The existing Socket.IO infrastructure (`config/socket.js`, `services/socketService.js`)
is reused without modification to the authentication handshake or notification
machinery:

- On connection the server joins the socket to every `conv:<id>` room the user
  participates in, mirroring the `user:<id>` room already used for notifications.
- REST `POST /messages` persists and then emits `chat:message` to the relevant
  `conv:<id>` room — no separate WebSocket send path is needed.
- On reconnect the server replays the latest message preview per conversation
  (`chat:previews`), mirroring the `pending_notifications` replay.

### REST API

- `GET  /api/chat/conversations` — list the caller's conversations.
- `POST /api/chat/conversations/project/:projectId` — open/create a project room.
- `POST /api/chat/conversations/dm` — open/create a DM.
- `GET  /api/chat/conversations/:id/messages` — cursor-paginated history.
- `POST /api/chat/conversations/:id/messages` — send a message.
- `DELETE /api/chat/conversations/:id/messages/:msgId` — soft-delete own message.

All POST request bodies are validated with Zod schemas in `validations/chatSchemas.js`.
All endpoints carry OpenAPI annotations.

## Consequences

- The chat feature is fully isolated in new files (`chatController.js`,
  `chatRoutes.js`, `chatSchemas.js`, `ChatContext.jsx`, `ChatPage.jsx`,
  `ConversationList.jsx`, `MessageThread.jsx`, `MessageInput.jsx`,
  `chatApi.js`). No existing controller or route was modified.
- `config/socket.js` gains ~30 lines to join `conv:` rooms and replay previews;
  the authentication and notification sections are unchanged.
- `app.js` gains a single route mount.
- The Prisma schema gains three models and two back-relations (`Workspace`,
  `Project`, `User`).
- DM scoping requires a shared workspace; two users on separate workspaces cannot
  exchange messages. This is the correct behaviour for multi-tenant isolation.
