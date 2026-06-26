# Architecture Decision Records

These ADRs capture the significant, hard-to-reverse decisions behind Quirk. Read
them before changing the areas they cover — they explain choices you must not
silently undo. Start with [ARCHITECTURE.md](../ARCHITECTURE.md) for the overview.

| ADR | Decision |
| --- | --- |
| [0001](./0001-use-uuid-identifiers-end-to-end.md) | UUID string identifiers end to end; never numeric-coerce IDs |
| [0002](./0002-workspace-tenancy-and-scoped-authorization.md) | Workspace tenancy and object-level scoped authorization |
| [0003](./0003-registration-email-verification-and-2fa.md) | Self-service registration, email verification, and login 2FA |
| [0003](./0003-realtime-chat-and-dm-module.md) | Real-time chat and direct-message module |
| [0004](./0004-task-level-object-authorization.md) | Task-level object authorization |
| [0005](./0005-calendar-and-timeline-views-consume-task-query-api.md) | Calendar and timeline views consume the task query API |
| [0006](./0006-kanban-column-as-task-workflow-state.md) | Kanban column as the single source of task workflow state |
| [0007](./0007-role-escalation-prevention.md) | Role-escalation prevention |
| [0008](./0008-platform-admin-and-srs-tenant-roles.md) | Platform admin separated from SRS tenant roles |
| [0009](./0009-separate-platform-support-console.md) | Separate platform support console from tenant workspaces |
| [0010](./0010-ai-assistant-provider-fallback-and-tools.md) | AI assistant with provider fallback and RBAC-safe tools |

> Note: two records share the number 0003 (chat module and registration/2FA) from
> parallel feature branches. The numbers are retained as-is to keep existing links
> stable; treat the filename as the canonical reference.
