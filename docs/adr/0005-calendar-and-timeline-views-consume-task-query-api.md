# 5. Calendar and Timeline views consume the task query API

- Status: Accepted
- Date: 2026-06-23

## Context

Users need richer ways to visualise their work beyond a Kanban board and a flat
list. Two additional views were requested:

1. **Calendar** — a month-grid showing tasks mapped to their `dueDate`.
2. **Timeline (Gantt)** — a horizontal bar chart showing each task's duration
   (from `createdAt` to `dueDate`) grouped by Status or Priority across a
   chosen month.

The backend already exposes a scoped task list through the task query API
(ADR 0004). Adding per-view API endpoints would duplicate that query surface
and violate the constraint stated in `AGENTS.md`.

## Decision

Both views are implemented **entirely in the frontend**:

- `TaskCalendarView` and `TaskTimelineView` are React components mounted inside
  `TaskBoardPage`. They receive the `filtered` tasks array that is already
  fetched once on page load and passed to the existing Kanban and List views.
- No new backend routes, controllers, validations, or queries are added.
- Clicking a task in either view opens the existing `TaskModal`, re-using the
  same create/edit/read flow.
- The components follow the Quirk Mint & Ink design system tokens defined in
  `index.css` and `design.md`. A missing `--colors-primary-glow` token was
  defined in `index.css` alongside this change, as it was referenced in several
  existing components without a declaration.

## Consequences

- The frontend renders Calendar and Timeline views from already-fetched data
  with zero additional network requests.
- Adding per-view filter controls (e.g. date-range filtering) in the future can
  be achieved by extending the existing `filters` state in `TaskBoardPage`
  rather than adding new API parameters.
- If the task list grows very large, the client-side grouping and date-range
  iteration in `TaskTimelineView` may become slow. A future optimisation could
  pre-paginate or window the task list; no backend change would be required
  since the view logic is fully isolated in the component.
