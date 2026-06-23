# 6. Kanban column as task workflow state

- Status: Accepted
- Date: 2026-06-23

## Context

Tasks previously stored workflow position twice: `Task.columnId` pointed to the
project's `KanbanColumn`, while `Task.status` stored a separate string such as
`To Do`, `In Progress`, or `Completed`. That duplication made custom project
workflows fragile because a task could point at one column while its status string
claimed another state.

## Decision

Remove `Task.status`. A task's workflow state is its assigned
`KanbanColumn`, reached through `Task.columnId` and displayed through
`Task.column.name`.

Task create and update requests accept `columnId`; task reads include the related
column metadata. Moving a task uses `PATCH /api/tasks/:id/column` with a UUID
`columnId`. If a task is created for a project without an explicit column, the
backend assigns the first ordered project column.

The frontend renders board, table, detail, modal, and filter controls from project
columns returned by the API. It no longer imports hardcoded task-status constants.

## Consequences

- Custom project columns are the only persisted workflow source for tasks.
- Clients compare and submit UUID column identifiers, not display labels.
- Existing notification and activity events describe column changes rather than a
  separate status field.
- Terminal-column behavior, such as completion counts and overdue filtering, is
  derived from the task's column name until richer per-column metadata exists.
