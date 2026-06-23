
## Software Requirements Specification (SRS)

**Total Allocated Marks for Final Evaluation:** 40%

**Final Submission Deadline:** 2026-06-06

**Group Assignment | INTE 21323** A Task Management System (TMS) is a software application designed to help individuals or teams plan, organize, track, and complete tasks efficiently. It's widely used in personal productivity, team collaboration, and project management. A Task Management System (TMS) is essential in project management because it provides a structured way to organize, assign, and track tasks throughout the project lifecycle.

In any project, multiple activities need to be coordinated among different team members, and without a centralized system, tasks can easily be overlooked, duplicated, or delayed. A TMS ensures that every task is clearly defined, assigned to a responsible individual, and given a deadline, which improves accountability and reduces confusion within the team. It also enables real-time progress tracking, allowing managers to monitor what has been completed, what is in progress, and what is pending, thereby making it easier to identify bottlenecks early and take corrective action.

Additionally, by centralizing all project-related information such as task details, updates, and communication, a TMS enhances collaboration and keeps everyone aligned with project goals. Tools like Trello and Jira demonstrate how such systems can improve efficiency and productivity by streamlining workflows and ensuring that deadlines are consistently met, ultimately contributing to the successful completion of projects.

Popular examples include:

* Trello
* Asana
* Jira (Target Architecture & Workflow)

---

## Introduction

This document defines the functional and non-functional requirements for the Task Management System, a full-stack web application that allows users to create, manage, and track tasks collaboratively in real time. The system enables:

* User Registration, Authentication and role-based access control
* Comprehensive User Onboarding and Workspace Setup
* Task creation, assignment, and dependency tracking
* Agile project management features (Custom Kanban boards, Subtasks, Epics)
* Real-time Notifications updates using WebSockets
* Secure API communication
* Deployment in a cloud environment

---

## Functional Requirements

### User Authentication

The system shall allow registered users to log in using valid credentials (email and password). Credentials shall be validated against stored records with proper input validation and secure handling.

* **On success:** access is granted
* **On failure:** appropriate error message is returned

### JWT-Based Session Management

Upon successful authentication:

* The system shall generate a JWT (JSON Web Token) containing user ID, role, and expiration time.
* The token shall be securely signed to prevent tampering.
* The token shall be securely stored on the client (e.g., HTTP-only cookies or secure storage).
* The client shall include the token in the Authorization header for all protected API requests.

The system shall:

* Validate token signature, expiration, and integrity on each request
* Support token expiration and optional refresh mechanism (gap filled)
* Reject invalid/expired tokens with appropriate responses

### Authorization & Role-Based Access Control (RBAC)

Access to system features shall be restricted based on authentication status and user roles:

* Protected routes require a valid JWT
* Unauthorized access → 401 Unauthorized
* Forbidden actions → 403 Forbidden

**Roles:**

* **Administrator (Admin):** Full access to user management, system configuration, and global workspace settings.
* **Project Manager:** Can create/manage projects, customize workflows (Kanban columns), assign tasks, set priorities, deadlines, and view project analytics.
* **Collaborator:** Can view assigned tasks, update task status, add comments/attachments, and log time. Cannot delete projects or modify workflow structures.

---

## User Management & SaaS-Style Onboarding

### User Onboarding Flow

To ensure a professional app experience, new users shall go through an interactive setup process:

* **Welcome Wizard:** Upon first login, users complete their profile (Avatar upload, Job Title, Timezone).
* **Workspace Setup (For PMs/Admins):** Users creating a new account can name their Workspace/Organization and invite initial team members via email.
* **Template Selection:** Users can choose a starter template for their first project (e.g., "Software Development," "Marketing Campaign," or "Basic Kanban").
* **Interactive Tooltips:** A brief, dismissible product tour shall highlight key UI elements (e.g., "Click here to create your first task", "Drag this card to update its status").

### User Management (Admin Module)

Accessible primarily to Administrators.

* Create, view, update, deactivate users.
* Assign roles to users and group them into Teams/Departments.
* View users via searchable and filterable lists.
* **Security:** Enforce minimum password length and complexity. Passwords shall be stored using secure hashing (e.g., bcrypt).

---

## Advanced Task & Project Management (Jira/Asana Inspired)

### Core Project Structure

Projects shall be organized into a hierarchy: **Workspace → Project → Task → Subtask.**

Authorized users shall be able to:

* Create and manage tasks with multiple views (Kanban Board, List View).
* **Custom Workflows:** Project Managers can create custom Kanban columns (e.g., "To Do", "In Review", "QA Testing", "Done") instead of hardcoded statuses.

### Task Attributes & Value Additions

Each task shall include standard fields (Title, Description, Assignee, Due Date, Priority) alongside advanced features:

* **Rich Text Description:** Standard WYSIWYG or Markdown editor for clear formatting.
* **Subtasks:** Ability to break a large task down into a checklist of smaller, assignable subtasks.
* **Task Dependencies:** Ability to mark tasks as "Blocked By" or "Blocking" other tasks to prevent bottlenecks.
* **Tags & Epics:** Ability to group related tasks under a broader category or label for easier filtering.
* **Time Tracking:** Users can input estimated hours and log actual time spent on a task.

### Validation & Permissions

* Title is mandatory. Due date must be valid.
* **Project Managers:** Full control over project settings, column creation, and task deletion.
* **Collaborators:** Can update statuses, upload attachments, log time, and comment.

---

## Real-Time Features (WebSocket-Based)

The system shall use WebSockets to push updates without polling.

### Events and Notifications

Users shall receive real-time notifications for:

* Task assignments and mentions in comments (`@username`).
* Status changes on tasks they are watching/assigned to.
* Approaching deadlines.

### Client Behavior & Reliability

* UI shall update dynamically (e.g., if User A moves a Kanban card, User B sees it move instantly).
* Displayed via in-app alerts or a dedicated notification bell panel.
* **Offline users:** Notifications shall be stored in the database and delivered as unread alerts upon next login.

---

## Reporting & Activity Tracking (Value Additions)

* **Activity Log (Audit Trail):** Every task shall have an automated history thread (e.g., "John moved this task from 'To Do' to 'In Progress' at 10:00 AM").
* **Project Dashboard:** A high-level overview for Project Managers showing:
* Total tasks completion rate (Progress bar).
* Tasks overdue.
* Workload distribution per team member.



---

## Validation & Error Handling

The system shall enforce validation at both Frontend and Backend layers.

### Error Handling (Backend)

The API shall return Standard HTTP status codes with a Structured error response:

* Error code (e.g., 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error)
* Message & Detailed Description (if applicable)

### Frontend Handling

* Display user-friendly toast notifications for success/error states.
* Map input field-level errors directly below the corresponding input forms.
* Maintain consistent error UI patterns.

---

## Security

* Prevent SQL Injection using parameterized queries or ORM frameworks (e.g., Prisma, EF Core, TypeORM).
* Input data shall be validated and sanitized before processing to prevent XSS.
* Use HTTPS for deployed services.
* Use best practices referring to OWASP Top 10 recommendations.

---

## System Architecture

* Uses MVC pattern or standard decoupled REST/GraphQL API architecture.
* Modular database design to support relational data (Users, Projects, Tasks).

## Deployment Requirements

* Docker containerization, CI/CD, cloud hosting.
* Deploy both backend and frontend on a cloud platform (Azure, AWS, GCP, Vercel/Render, or similar).
* Ensure CORS and environment configuration for production.
* Provide a working demo link for both the frontend and the backend.

## Testing Requirements

* Functional testing covering core user flows (Auth, CRUD operations, Websocket updates).

## Git & Documentation Requirements

### Version Control

* Every contributor must use feature branches.
* Use pull requests and merge commits.
* Follow meaningful commit messages.

### API Documentation

* Use Swagger/OpenAPI for documenting REST endpoints.

### README.md

* Project overview, Technologies used, Setup instructions, API usage link, and Team contributions.

### Folder Structure

* Follow clean, modular folder structure (e.g., `/controllers`, `/services`, `/routes`, `/models`).

---

## Deliverables

* Source code, API documentations, ER/Class diagrams, DB design, deployment diagrams.
* GitHub public repository link.
* Live hosted demonstration URL.

---

## Grading Criteria

**Total Marks: 100**

| Category | Marks (%) |
| --- | --- |
| Frontend | 20 |
| Backend | 20 |
| Database | 10 |
| Security | 15 |
| Real-Time Notifications | 10 |
| DevOps & Deployment | 20 |
| Documentation | 5 |
| **Total Marks** | **100** |

---