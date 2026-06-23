# Quirk — Task Management System

Quirk is a Jira-inspired SaaS application built for modern software teams, providing robust project management, issue tracking, and advanced real-time collaboration.

## 🚀 Architecture overview

- **Frontend**: React 18, React Router, Vite, Tailwind CSS (v4).
- **Backend**: Node.js, Express 5, Prisma ORM.
- **Database**: PostgreSQL (via Prisma).
- **Real-time**: Socket.io for live updates.
- **CI/CD**: Docker, Kubernetes (AKS), GitHub Actions.

## 📁 Repository Structure

```
.
├── backend/                  # Express server & APIs
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth, RBAC, Validation logic
│   ├── prisma/               # Schema definitions and migrations
│   ├── routes/               # API route definitions
│   ├── services/             # Background tasks, Socket emission, etc.
│   └── validations/          # Zod input validation schemas
│
├── frontend/                 # React UI
│   ├── src/
│   │   ├── components/       # Reusable components (common, tasks, layout)
│   │   ├── context/          # React Contexts (Auth, Project, Socket, Theme)
│   │   ├── pages/            # View shells (Dashboard, Projects, Tasks, etc.)
│   │   ├── services/         # Axios API clients
│   │   └── utils/            # Shared helpers & constants
│   ├── index.css             # Main stylesheet & Design Tokens
│   └── tailwind.config.js    # Tailwind customizations
│
├── k8s/                      # Kubernetes Deployment Configs
└── .github/workflows/        # CI/CD pipelines
```

## 🎨 Design System

Quirk utilizes a strictly defined UI design system:
- **Canvas Colors**: Soft off-white base (`#f6f5f4`) with premium dark mode.
- **Typography**: Inter with specific negative letter-spacing for headers.
- **Primary Brand Color**: Quirk Green (`#75EE8F`) used exclusively for CTAs and interactive focus.
- **Core Components**:
  - `Button.jsx`: Modular buttons (primary, secondary, utility, icon-circular)
  - `ErrorBoundary.jsx`: Graceful fallback wrappers.
  - `index.css`: Houses all CSS custom properties and semantic utilities (`.feature-card`, `.btn-primary`).

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL instance running locally (or Dockerized)

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example` and set `DATABASE_URL` + JWT secrets.
4. `npx prisma migrate dev` (Apply DB schemas)
5. `npm run dev` (Runs on port 5000)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create `.env` (optional, for custom API URL)
4. `npm run dev` (Runs Vite server, usually on 5173)

## 🤝 For Contributors / Teammates

### Branching Strategy
We use **Feature Branching**:
- Base your work off the main branch (or the current core feature branch, e.g., `feature/ui-overhaul-and-base-arch`).
- Run `git checkout -b feature/your-feature-name`.
- Use **Conventional Commits**: `feat(scope): message` or `refactor(scope): message`.

### Building New Features
If you are assigned to a specific module (e.g., Projects, Analytics, Onboarding):
1. **Find your Shell Page**: Placeholder pages exist in `frontend/src/pages/` (e.g., `AnalyticsPage.jsx`).
2. **Build Components**: Add your feature components under `frontend/src/components/feature-name/`.
3. **Use the Design System**: DO NOT write custom hex colors inline. Use the CSS variables defined in `index.css` (e.g., `var(--colors-ink-muted)` or utility classes like `feature-card`).
4. **Follow API Patterns**: Extend API calls via the existing `axios` wrapper in `frontend/src/services/`.

## 🚢 Deployment

Committing to `main` triggers the GitHub Actions CI/CD pipeline which builds Docker images, runs Prisma migrations via init containers, and deploys to Azure Kubernetes Service (AKS).

Ensure your branch passes local validation (`npm test`, if any, and starts successfully) before opening a PR.
