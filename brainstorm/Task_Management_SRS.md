# Software Requirements Specification (SRS)
## Task Management System

**Course:** Group Assignment | INTE 21323  
**Evaluation:** Total Allocated Marks for Final Evaluation (40%)  
**Final Submission Deadline:** 2026-06-06  

---

### 1. Introduction
A Task Management System (TMS) is a software application designed to help individuals or teams plan, organize, track, and complete tasks efficiently. It is widely used in personal productivity, team collaboration, and project management. 

A TMS is essential in project management because it provides a structured way to organize, assign, and track tasks throughout the project lifecycle. In any project, multiple activities need to be coordinated among different team members; without a centralized system, tasks can easily be overlooked, duplicated, or delayed. A TMS ensures that every task is clearly defined, assigned to a responsible individual, and given a deadline, which improves accountability and reduces confusion within the team.

It also enables real-time progress tracking, allowing managers to monitor what has been completed, what is in progress, and what is pending, thereby making it easier to identify bottlenecks early and take corrective action. Additionally, by centralizing all project-related information such as task details, updates, and communication, a TMS enhances collaboration and keeps everyone aligned with project goals. Popular commercial examples include Trello, Asana, and Jira, which demonstrate how such systems improve efficiency and productivity by streamlining workflows and ensuring deadlines are consistently met.

This document defines the functional and non-functional requirements for the Task Management System, a full-stack web application that allows users to create, manage, and track tasks collaboratively in real time.

The system enables:
* User Registration, Authentication, and Role-Based Access Control (RBAC)
* Task creation and assignment
* Setting deadlines and priorities
* Tracking progress (e.g., *To Do* $\rightarrow$ *In Progress* $\rightarrow$ *Done*)
* Collaboration via comments, attachments, and updates
* Real-time notification updates using WebSockets
* Secure API communication
* Deployment in a cloud environment

---

### 2. Functional Requirements

#### 2.1 User Authentication
* The system shall allow registered users to log in using valid credentials (email and password).
* Credentials shall be validated against stored records with proper input validation and secure handling.
  * **On success:** Access is granted.
  * **On failure:** An appropriate error message is returned.

#### 2.2 JWT-Based Session Management
Upon successful authentication:
* The system shall generate a JWT (JSON Web Token) containing the user ID, role, and expiration time.
* The token shall be securely signed to prevent tampering.
* The token shall be securely stored on the client (e.g., HTTP-only cookies or secure storage).
* The client shall include the token in the `Authorization` header for all protected API requests.
* The system shall:
  * Validate token signature, expiration, and integrity on each request.
  * Support token expiration and an optional refresh mechanism.
  * Reject invalid or expired tokens with appropriate responses.

#### 2.3 Authorization & Role-Based Access Control (RBAC)
Access to system features shall be restricted based on authentication status and user roles:
* Protected routes require a valid JWT.
* Unauthorized access attempts must return a `401 Unauthorized` status.
* Forbidden actions must return a `403 Forbidden` status.

##### User Roles & Permissions
* **Administrator (Admin):** Full access to user management and system configuration. Can create, update, deactivate users, and assign roles.
* **Project Manager:** Can create and manage projects and tasks, assign tasks, set priorities/deadlines, and monitor progress.
* **Collaborator:** Can view assigned tasks, update task status, and add comments or attachments. Cannot modify restricted fields or delete tasks.

#### 2.4 User Management
* Accessible only to Administrators. Other users do not have the ability to update other profiles or their own roles.
* **Core Features:**
  * Create, view, update, and deactivate users.
  * Assign roles to users.
  * View users via a searchable and filterable list.
* **Validation & Constraints:**
  * Required fields: Name, email, role.
  * Email must be valid and unique.
  * All inputs must be validated before submission.
* **User Onboarding:**
  * Upon user creation, the system shall send an email containing the username and a temporary password.
  * On first login, users must mandatorily reset their password before accessing the system.
  * Password policies must be strictly enforced, including minimum length and complexity requirements.
* **Storing Passwords:**
  * Passwords shall be stored using secure cryptographic hashing (e.g., `bcrypt`). Plain-text passwords shall never be stored.
  * All operations shall include validation, robust error handling, and success confirmations.

#### 2.5 Task Management
* **Core Features:** Authorized users (primarily Project Managers) shall be able to create, view, update, assign, and delete tasks.
* **The system shall provide:**
  * Diverse task views (Table, Board, or Kanban layouts).
  * Advanced filtering and sorting capabilities.
* **Task Attributes:** Each task shall include:
  * Title (Required)
  * Description
  * Assigned user(s)
  * Due date
  * Priority (`Low`, `Medium`, `High`)
  * Status (`To Do`, `In Progress`, `Completed`)
* **Validation Rules:**
  * Title is mandatory.
  * Due date must be valid (past dates are restricted unless explicitly allowed).
  * Priority must match predefined values.
  * Assignment is limited to existing, registered users.
* **Permissions:**
  * *Project Managers:* Full task control.
  * *Collaborators:* Can view assigned tasks, update status, and add comments/attachments. Cannot delete or modify restricted fields.
* **System Behavior:**
  * All operations shall include validation and proper error handling.
  * The UI shall provide clear feedback and confirmations.
  * Task updates shall reflect immediately across clients (linked to the real-time module).

#### 2.6 Real-Time Features (WebSocket-Based)
* The system shall use WebSockets to push updates instantly without traditional polling.
* **Events and Notifications:** Users shall receive real-time notifications for:
  * Task assignments
  * Status changes
  * New comments
  * Approaching deadlines
  * Administrative updates
* **Client Behavior:**
  * A WebSocket connection must be established immediately after successful authentication.
  * The UI shall update dynamically to reflect modifications to tasks, statuses, and notifications.
* **Notification Handling:**
  * Notifications shall be role-based and user-specific.
  * Notifications shall be displayed via in-app alerts or a dedicated notification panel.
  * *Offline users:* Notifications shall be stored in the database and delivered immediately upon reconnection.
* **Reliability & Security:**
  * Implement robust reconnection strategies (e.g., exponential backoff retry algorithms).
  * Ensure secure transmission protocols (e.g., `WSS`).
  * Prevent unauthorized subscription to event streams.

---

### 3. Technical & Non-Functional Requirements

#### 3.1 Validation & Error Handling
* The system shall enforce validation at both levels:
  * **Frontend:** Immediate user feedback.
  * **Backend:** Final data validation layer.
* Validation checks include required fields, standard data formats (emails, dates), and domain business rules.
* **Backend Error Handling:** The API shall return standard HTTP status codes accompanied by a structured error response payload consisting of:
  * `Error code`
  * `Message`
  * `Detailed Description` (if applicable)
* **Standard Error Codes:**
  * `400 Bad Request`
  * `401 Unauthorized`
  * `403 Forbidden`
  * `500 Internal Server Error`
* **Frontend Handling:**
  * Display user-friendly, descriptive error messages.
  * Map input field-level errors directly to the corresponding UI inputs.
  * Show global errors via prominent alerts or system notifications.
  * Maintain consistent error UI patterns throughout the application.

#### 3.2 Security
* **SQL Injection (SQLi) Prevention:** The system shall prevent SQL injection attacks by ensuring that user inputs cannot manipulate database queries. All database interactions shall use parameterized queries or trusted Object-Relational Mapping (ORM) frameworks (e.g., EF Core) instead of dynamic string concatenation.
* Input data shall be thoroughly validated and sanitized before processing.
* Stored procedures (if used) shall avoid dynamic SQL execution.
* Store passwords securely using `bcrypt` or `scrypt` hashing algorithms.
* Mandate the use of HTTPS for all deployed production services.
* Sanitize and validate all inputs to eliminate Cross-Site Scripting (XSS) and SQLi vectors.
* Align security architecture with the best practices recommended in the OWASP Top 10.
* Ensure all data transmitted between the client and the server is encrypted using HTTPS (TLS).

#### 3.3 System Architecture & Deployment
* **Architecture:** Follows the Model-View-Controller (MVC) design pattern with a clean, modular folder structure (e.g., `/controllers`, `/services`, `/routes`).
* **Deployment Requirements:** * Docker containerization, CI/CD pipeline implementation, and cloud hosting.
  * Deploy both backend and frontend environments on a cloud platform (Azure, AWS, GCP, or similar).
  * Properly configure Cross-Origin Resource Sharing (CORS) and environment variables for production environments.
  * Provide a working live demo link for both the frontend application and the backend API endpoints.

#### 3.4 Testing & Git Requirements
* **Testing:** Functional testing execution is mandatory.
* **Version Control:**
  * Every contributor must work within feature branches.
  * Use pull requests and explicit merge commits.
  * Adhere to meaningful, structured commit messages.
* **API Documentation:** Use Swagger / OpenAPI spec for documenting all REST endpoints.
* **README.md Requirements:** Must include a project overview, comprehensive list of technologies used, step-by-step setup instructions, API usage guidelines (with a link to the Swagger UI), and explicit documentation of team member contributions.
* **Deliverables:** Source code, API documentation, Entity-Relationship (ER) / Class diagrams, Database Design schemas, and Deployment diagrams.
* **Repository:** After project initiation, teams must publish their complete source code to a public GitHub repository and share the link. The website must be demonstrated live from a properly hosted URL.

---

### 4. Grading Criteria
**Total Marks:** 100% (Contributes 40% to the final evaluation course score)

| Category | Marks (%) |
| :--- | :---: |
| Frontend | 20% |
| Backend | 20% |
| Database | 10% |
| Security | 15% |
| Real-Time Notifications | 10% |
| DevOps & Deployment | 20% |
| Documentation | 5% |
| **Total Marks** | **100%** |
