# Quirk Product Design System

Quirk is a multi-tenant task-management SaaS for teams that need projects,
tasks, chat, deadlines, and workspace administration in one calm operating
surface. The design should feel like a focused workbench: spacious enough to
scan, dense enough for daily operations, and never like a generic admin theme.

## Principles

- Show the active workspace everywhere meaningful. Workspace context is the
  tenant boundary, so navigation, project lists, chat, and task creation should
  all make it obvious which workspace is active.
- Use project context deliberately. Project pages show project-specific tasks;
  the general task board shows every accessible task and includes the project
  name where a task belongs to one.
- Keep controls close to the object they affect. Project edit/archive/delete
  actions live on project cards; project member assignment lives on the project
  detail page; task assignment lives inside the task modal.
- Avoid generic browser controls. Selects, dropdowns, modals, and lists use the
  same rounded geometry, border color, focus state, and spacing as the rest of
  Quirk.
- Do not gray out editable task fields for valid project managers. Disabled
  states are only for true permission or dependency constraints, and validation
  explains why an action is blocked.

## Colors

### Core

- **Canvas** `--colors-canvas`: main page background.
- **Canvas Soft** `--colors-canvas-soft`: bands, table zones, Kanban board
  background.
- **Canvas Softer** `--colors-canvas-softer`: form field fill.
- **Ink** `--colors-ink`: primary copy and labels.
- **Body** `--colors-body`: supporting copy.
- **Mute** `--colors-mute`: placeholders, secondary metadata.
- **Hairline** `--colors-hairline`: borders and dividers.

### Brand

- **Primary Green** `--colors-primary`: primary CTAs, focus accents, active
  navigation, selected chips.
- **Primary Active/Hover/Glow**: hover, active, and subtle selected backgrounds.

### Semantic

- Priority colors are reserved for task priority and deadline urgency.
- Destructive actions use the danger button treatment, not primary green.
- Chat/project room online accents may use primary green, but message surfaces
  stay neutral.

## Typography

- Use the existing app font stack and tokenized type scale.
- Page titles use `--typography-heading-1` with normal or semibold weight.
- Card titles use `--typography-title`.
- Body text uses `--typography-body-md` or `--typography-body-sm`.
- Labels are short, semibold, and sentence case unless they are small section
  eyebrows.

## Layout And Spacing

- Main app pages use `page-shell` and `space-y-8` for vertical rhythm.
- Cards use at least `p-5` or `p-6`; dense rows use `px-4 py-3`.
- Never place borders directly against text. Inputs and dropdowns use 12-16px
  horizontal padding; cards keep 20-24px interior padding.
- Kanban/list/calendar/timeline views live inside the task work area with
  consistent `p-6` gutters.
- Modals use a clear header, scrollable body, and footer actions separated by a
  hairline.

## Shapes And Elevation

- Cards: `--radius-xl`.
- Inputs/selects: `--radius-md`.
- Rows and compact containers: `--radius-lg`.
- Buttons and pills: rounded-full unless the existing component says otherwise.
- Shadows are restrained. Use borders plus subtle app shadows; avoid heavy,
  generic dashboard elevation.

## Navigation

### Sidebar

- The sidebar is the primary app switchboard.
- It shows a real workspace switcher when the user belongs to more than one
  workspace.
- The workspace block always exposes workspace creation so a user can add another
  tenant context without leaving the app shell.
- The workspace block shows the active workspace name and the caller's workspace
  role.
- The collapse and expand control stays beside the logo in both sidebar states.
- Role-specific navigation may hide platform-only modules, but workspace/project
  permissions must still be enforced by the backend.

### Top Bar

- Breadcrumbs begin with the active workspace name when available.
- The New Task action opens the task modal on the task page or navigates to the
  task board with the create state.
- Notifications remain available globally from the bell.

## Projects

- Project cards show the project initial, name, description, column count,
  workflow chips, overflow count, and project status.
- Workspace Owners/Admins and platform Admins can create, edit, archive, and
  delete projects.
- Project creation offers either a template or a blank Basic Kanban start.
- Project detail pages show workflow columns, project metrics, and project member
  assignment. Project Managers and workspace managers can add, rename, reorder,
  and delete workflow columns after creation.
- Project Managers can manage members and create tasks only inside projects they
  manage unless they also hold workspace Owner/Admin permissions.

## Tasks

- Task creation requires a project and column.
- Task title and description are never disabled for a user who can manage the
  selected project.
- Assignee choices are scoped to members of the selected project.
- Due date inputs send date-only values from the UI; the backend accepts and
  normalizes them.
- General Tasks shows all accessible tasks. Project-specific task links use
  `/tasks?projectId=<id>` and filter both tasks and workflow columns.
- Calendar and timeline views consume the same task query as the board/list views.
- Clicking a task in board, list, calendar, timeline, or dashboard views opens the
  task modal. Managers can edit task fields; collaborators with access can read
  details, comment, and use the column move controls allowed by the backend.

## Analytics

- Analytics should answer operational business questions, not only count rows.
- Useful signals include completion rate, overdue risk, near-term due work,
  assignment coverage, average active task age, project delivery health, and a
  short list of tasks needing attention.

## Chat

- Chat is workspace-aware.
- Direct-message search lists active members of the selected workspace.
- Project rooms are visible from Chat for projects in the active workspace.
- Adding/removing project members also updates project chat participants.

## Empty, Loading, And Error States

- Empty states should offer the next valid action when the current user has
  permission.
- Field errors render below the field via the shared `Input` pattern.
- Permission issues should be shown as validation or toast messages, not silent
  disabled UIs.
- Loading skeletons should use the target layout shape rather than generic bars.

## Do

- Keep tenant/workspace context visible.
- Reuse shared `Button`, `Input`, `Modal`, `EmptyState`, `ViewHeader`, and
  `ViewToolbar` components.
- Give dropdowns the same padding, border, radius, and focus state as text
  inputs.
- Keep project member and task assignee lists scoped to workspace/project
  membership.
- Update docs when business behavior changes.

## Don't

- Do not rely on global user roles for object-level UI decisions when workspace
  or project membership is available.
- Do not call admin-only user endpoints from collaborator/PM workflows.
- Do not hide backend errors behind mock state.
- Do not introduce unrelated brand palettes or third-party style language.
- Do not use negative letter spacing or oversized hero treatment inside the app
  shell.
