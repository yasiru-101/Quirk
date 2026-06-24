# SRS Coverage Notes

This file tracks the minimum requirements from `Task_Management_SRS.md` against
the current implementation.

## Covered

- User registration, login, email verification, JWT cookies, refresh, password
  reset, and optional email 2FA.
- Workspace onboarding with user-owned workspace creation.
- Workspace/project hierarchy with object-level authorization.
- Project creation, edit, archive, delete, membership assignment, and Kanban
  workflow column creation, renaming, reordering, and deletion.
- Task creation, assignment, priority, due date, comments, attachments, time logs,
  activity logs, and Kanban/list/calendar/timeline consumption of the task query.
- Real-time notifications through Socket.IO for assignments, column changes,
  comments, deadline checks, and admin notices.
- Realtime project chat and workspace-scoped direct messages.
- Docker, Kubernetes manifests, and GitHub workflow structure.
- Swagger/OpenAPI annotations for core routes.

## Partial Or Needs Follow-Up

- Rich text descriptions are currently plain textarea content.
- Subtasks and dependencies exist in the data model but need fuller UI workflows.
- Custom workflow column management exists in the API but needs a polished UI.
- Product tour/tooltips are not fully implemented.
- Analytics now cover completion, overdue risk, due-soon work, assignment
  coverage, average active task age, project delivery health, and attention
  lists; deeper trend charts remain future work.
- Automated functional test coverage should be broadened for onboarding,
  workspace switching, project membership, and task/calendar flows.

## Recent Alignment

- New self-service users now receive a real owned workspace during onboarding.
- Projects are workspace-scoped and task creation uses project membership rather
  than a global role-only assumption.
- Project-specific task navigation filters the shared task query by project.
- Chat now exposes project rooms for active workspace projects and keeps project
  room participants in sync with project membership.
- Task rows/cards across dashboard, board, list, calendar, and timeline open the
  task modal; accessible users can comment while managers retain edit controls.
