# Diagrams

Visual models of Quirk, written in [Mermaid](https://mermaid.js.org) so they render
directly on GitHub and stay versioned with the code. They are derived from the
actual schema, routes, and manifests.

**Contents**

1. [Domain class diagram](#1-domain-class-diagram)
2. [Deployment diagram](#2-deployment-diagram)
3. [System architecture / components](#3-system-architecture--components)
4. [Authentication sequence](#4-authentication-sequence)
5. [AI assistant request flow](#5-ai-assistant-request-flow)
6. [Use-case diagram](#6-use-case-diagram)
7. [Multi-tenant authorization scopes](#7-multi-tenant-authorization-scopes)
8. [Task lifecycle (Kanban workflow)](#8-task-lifecycle-kanban-workflow)

> An entity-relationship diagram focused on cardinality lives in
> [DATABASE.md](./DATABASE.md#entity-relationship-diagram).

---

## 1. Domain class diagram

The core domain model — entities, their key attributes, and associations with
multiplicity. Full field lists are in [DATABASE.md](./DATABASE.md).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','primaryTextColor':'#10241a','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
classDiagram
direction LR

class User {
  +UUID id
  +String name
  +String email
  +String passwordHash
  +Boolean isPlatformAdmin
  +Boolean emailVerified
  +Boolean twoFactorEnabled
  +Boolean isActive
}
class Workspace {
  +UUID id
  +String name
  +UUID ownerId
}
class WorkspaceMember {
  +UUID workspaceId
  +UUID userId
  +String role
}
class Invitation {
  +UUID id
  +String email
  +String tokenHash
  +String status
}
class OtpCode {
  +UUID id
  +String codeHash
  +String purpose
}
class Project {
  +UUID id
  +String name
  +String status
}
class ProjectMember {
  +UUID projectId
  +UUID userId
  +String role
}
class KanbanColumn {
  +UUID id
  +String name
  +Int order
}
class Epic {
  +UUID id
  +String name
}
class Task {
  +UUID id
  +String title
  +String priority
  +DateTime dueDate
  +UUID columnId
  +UUID parentTaskId
}
class TaskAssignment {
  +UUID taskId
  +UUID userId
}
class Comment {
  +UUID id
  +String content
}
class Attachment {
  +UUID id
  +String blobUrl
  +Int sizeBytes
}
class TimeLog {
  +UUID id
  +Float hours
}
class ActivityLog {
  +UUID id
  +String action
}
class Notification {
  +UUID id
  +String type
  +Boolean isRead
}
class Conversation {
  +UUID id
  +String type
}
class ConversationParticipant {
  +UUID conversationId
  +UUID userId
}
class ChatMessage {
  +UUID id
  +String content
}

User "1" --> "*" WorkspaceMember : membership
Workspace "1" --> "*" WorkspaceMember
User "1" --> "*" Workspace : owns
Workspace "1" --> "*" Invitation
User "1" --> "*" OtpCode
Workspace "1" --> "*" Project
Project "1" --> "*" ProjectMember
User "1" --> "*" ProjectMember
Project "1" --> "*" KanbanColumn
Project "1" --> "*" Epic
Project "1" --> "*" Task
KanbanColumn "1" --> "*" Task : status
Epic "0..1" --> "*" Task
Task "0..1" --> "*" Task : subtasks
Task "1" --> "*" TaskAssignment
User "1" --> "*" TaskAssignment
Task "1" --> "*" Comment
Task "1" --> "*" Attachment
Task "1" --> "*" TimeLog
Task "1" --> "*" ActivityLog
User "1" --> "*" Notification
Workspace "1" --> "*" Conversation
Project "0..1" --> "0..1" Conversation
Conversation "1" --> "*" ConversationParticipant
Conversation "1" --> "*" ChatMessage
User "1" --> "*" ChatMessage : sends
```

---

## 2. Deployment diagram

Runtime topology on Azure: ingress + TLS, the AKS `quirk` namespace, and the
managed services the backend depends on. See [DEPLOYMENT.md](./DEPLOYMENT.md).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
flowchart TB
  user(["User browser"])
  gh["GitHub Actions<br/>CI/CD pipeline"]

  subgraph azure["Azure cloud"]
    direction TB
    acr["Container Registry<br/>quirkimsacr.azurecr.io"]

    subgraph aks["AKS cluster — namespace: quirk"]
      direction TB
      ing["Ingress — ingress-nginx<br/>quirk-app.ddns.net • TLS (cert-manager)"]
      fe["Frontend pods<br/>Nginx + React SPA"]
      be["Backend pods ×2<br/>Express API :5000"]
      cm["ConfigMap<br/>quirk-config"]
      sec["Secret<br/>quirk-secrets"]
    end

    pg[("Azure PostgreSQL")]
    blob[("Azure Blob Storage")]
    acs["Azure Communication<br/>Services — email"]
  end

  aiext["AI providers<br/>Gemini • Groq"]

  user -->|"HTTPS"| ing
  ing --> fe
  fe -->|"/api • /api-docs • /socket.io"| be
  be --> pg
  be -->|"attachments"| blob
  be -->|"email"| acs
  be -->|"HTTPS"| aiext
  cm -.->|"env"| be
  sec -.->|"secrets"| be
  gh -->|"build & push images"| acr
  gh -->|"kubectl apply"| aks
  acr -.->|"pull"| fe
  acr -.->|"pull"| be

  classDef app fill:#e9fbee,stroke:#2fae54,color:#10241a;
  classDef data fill:#e7f0ff,stroke:#3f74c9,color:#10203a;
  classDef ext fill:#fff3e0,stroke:#e8973a,color:#3a2a14;
  classDef infra fill:#f3f7f4,stroke:#6b9a80,color:#10241a;
  class fe,be,ing app;
  class pg,blob data;
  class acs,aiext,acr,gh ext;
  class cm,sec infra;
```

---

## 3. System architecture / components

The layered request path through the SPA and the Express MVC backend.

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
flowchart LR
  subgraph client["Frontend — React + Vite SPA"]
    direction TB
    pages["Pages & views<br/>workspace shell • /platform console"]
    ctx["Contexts<br/>Auth • Project • Socket • Chat • Theme • Toast"]
    apisvc["Axios services"]
    pages --> ctx --> apisvc
  end

  subgraph server["Backend — Express MVC"]
    direction TB
    mw["Middleware pipeline<br/>Helmet • CORS • rate limit • sanitize<br/>protect • RBAC • validate (Zod)"]
    routes["Routes<br/>+ OpenAPI annotations"]
    ctrl["Controllers"]
    svc["Services<br/>email • storage • notifications • sockets • AI"]
    prisma["Prisma ORM"]
    mw --> routes --> ctrl --> svc
    ctrl --> prisma
    svc --> prisma
  end

  subgraph ext["Data & external services"]
    direction TB
    db[("PostgreSQL")]
    blob[("Azure Blob")]
    email["Email (ACS)"]
    ai["AI providers"]
  end

  apisvc -->|"REST /api (cookies)"| mw
  apisvc -.->|"WebSocket /socket.io"| svc
  prisma --> db
  svc --> blob
  svc --> email
  svc --> ai

  classDef fe fill:#e9fbee,stroke:#2fae54,color:#10241a;
  classDef be fill:#f3f7f4,stroke:#6b9a80,color:#10241a;
  classDef data fill:#e7f0ff,stroke:#3f74c9,color:#10203a;
  class pages,ctx,apisvc fe;
  class mw,routes,ctrl,svc,prisma be;
  class db,blob,email,ai data;
```

---

## 4. Authentication sequence

Login with optional email 2FA, then token rotation on refresh. Passwords are
bcrypt-hashed; tokens are HTTP-only cookies. See
[ADR 0003](./adr/0003-registration-email-verification-and-2fa.md).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
sequenceDiagram
  autonumber
  actor U as Browser
  participant API as Express API
  participant DB as PostgreSQL
  participant Mail as Email service

  U->>API: POST /auth/login (email, password)
  API->>DB: find user, verify bcrypt hash
  alt inactive or unverified
    API-->>U: 401 / 403 blocked
  else 2FA enabled
    API->>Mail: send one-time code
    API-->>U: pendingToken (awaiting 2FA)
    U->>API: POST /auth/verify-2fa (pendingToken, code)
    API->>DB: verify hashed code (single-use, attempt-limited)
    API-->>U: Set-Cookie access + refresh
  else 2FA disabled
    API-->>U: Set-Cookie access + refresh
  end

  Note over U,API: Protected requests send the accessToken cookie
  U->>API: POST /auth/refresh (refreshToken cookie)
  API->>DB: validate token + tokenValidFrom cutoff
  API-->>U: Set-Cookie rotated access + refresh
```

---

## 5. AI assistant request flow

Provider fallback (Gemini → Groq) with RBAC-safe tool execution. The context guard
and every tool re-apply the same object-level authorization as the REST API. See
[ADR 0010](./adr/0010-ai-assistant-provider-fallback-and-tools.md).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
sequenceDiagram
  autonumber
  actor U as Browser
  participant C as aiController
  participant O as Orchestrator
  participant P as Provider (Gemini→Groq)
  participant T as Tools (RBAC)
  participant DB as PostgreSQL

  U->>C: POST /api/ai/chat (message, projectId/workspaceId, history)
  C->>C: context guard — caller is a member?
  alt not a member
    C-->>U: 403 access denied
  else authorized
    C->>O: runAssistant(message, history, ctx)
    O->>P: chat(system, message, tools)
    alt provider rate-limited / unavailable
      O->>P: fall back to next provider
    end
    P-->>O: tool call (get_tasks / create_task)
    O->>T: executeTool(name, args, ctx)
    T->>DB: query/insert with same RBAC as REST
    T-->>O: structured result (or permission denial)
    O->>P: tool result
    P-->>O: final reply
    O-->>C: { reply, provider }
    C-->>U: 200 { reply, provider }
  end
```

---

## 6. Use-case diagram

Actors and the main use cases by authorization scope.

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
flowchart LR
  pa(["Platform Admin"])
  wa(["Workspace Admin"])
  pm(["Project Manager"])
  co(["Collaborator"])

  subgraph platform["Platform scope"]
    u1["View SaaS metrics"]
    u2["Manage users & roles"]
    u3["Review audit events"]
  end
  subgraph workspace["Workspace scope"]
    u4["Create workspace"]
    u5["Invite / manage members"]
    u6["Create projects"]
  end
  subgraph project["Project & task scope"]
    u7["Manage columns & members"]
    u8["Create / assign tasks"]
    u9["Move tasks • comment • attach • log time"]
    u10["Chat & notifications"]
    u11["Ask Quirk AI"]
  end

  pa --> u1 & u2 & u3
  wa --> u4 & u5 & u6
  pm --> u6 & u7 & u8 & u9
  co --> u9 & u10 & u11
  pm --> u10 & u11
  wa --> u10

  classDef actor fill:#10241a,stroke:#2fae54,color:#ffffff;
  classDef uc fill:#e9fbee,stroke:#2fae54,color:#10241a;
  class pa,wa,pm,co actor;
  class u1,u2,u3,u4,u5,u6,u7,u8,u9,u10,u11 uc;
```

---

## 7. Multi-tenant authorization scopes

Three independent scopes; access is always checked at the object level, not by role
alone. See [ADR 0002](./adr/0002-workspace-tenancy-and-scoped-authorization.md) and
[ADR 0008](./adr/0008-platform-admin-and-srs-tenant-roles.md).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
flowchart TB
  subgraph plat["Platform scope"]
    p1["User.isPlatformAdmin = true"]
    p2["SaaS support console /platform"]
  end
  subgraph ws["Workspace scope"]
    w1["WorkspaceMember.role"]
    w2["Admin • Project Manager • Collaborator"]
  end
  subgraph proj["Project scope"]
    r1["ProjectMember.role"]
    r2["Project Manager • Collaborator"]
  end

  guard{{"Object-level guard<br/>requirePlatformAdmin •<br/>requireWorkspaceRole •<br/>requireProjectRole / TaskAccess"}}

  plat --> guard
  ws --> guard
  proj --> guard
  guard -->|"caller belongs to context?"| allow["Allow"]
  guard -->|"otherwise"| deny["403 Deny"]

  classDef scope fill:#e9fbee,stroke:#2fae54,color:#10241a;
  classDef ok fill:#e7f7ec,stroke:#2fae54,color:#10241a;
  classDef no fill:#fde8e8,stroke:#d14d4d,color:#3a1414;
  class p1,p2,w1,w2,r1,r2 scope;
  class allow ok;
  class deny no;
```

---

## 8. Task lifecycle (Kanban workflow)

Columns are dynamic per project; a task's status **is** its `columnId`. The states
below illustrate a typical default board ([ADR 0006](./adr/0006-kanban-column-as-task-workflow-state.md)).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#e9fbee','primaryBorderColor':'#2fae54','lineColor':'#6b9a80','fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px'}}}%%
stateDiagram-v2
  [*] --> Backlog: create_task
  Backlog --> ToDo: prioritize
  ToDo --> InProgress: assign & start
  InProgress --> InReview: submit
  InReview --> InProgress: changes requested
  InReview --> Done: approve
  Done --> [*]
  InProgress --> Blocked: dependency
  Blocked --> InProgress: unblocked
```
