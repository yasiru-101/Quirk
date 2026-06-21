# Quirk TMS (Task Management System)

Quirk is a modern, real-time Task Management System designed for collaborative teams. It provides robust features for task tracking, real-time notifications, file attachments, and role-based access control.

## 🌟 Features

- **Role-Based Access Control (RBAC):** Distinct roles for Admin, Project Manager, and Collaborator.
- **Real-time Collaboration:** Live updates for task changes, assignments, and comments using Socket.io.
- **Task Management:** Create, assign, track, and comment on tasks.
- **Secure Authentication:** JWT-based authentication stored in HTTP-only cookies.
- **Cloud Integrations:** 
  - Azure PostgreSQL for persistent data storage.
  - Azure Blob Storage for secure file attachments.
  - Azure Communication Services for email notifications.
- **Modern UI:** Built with React, Vite, and TailwindCSS for a responsive and beautiful experience.

## 🚀 Technology Stack

### Backend
- **Node.js & Express:** Robust backend framework.
- **Prisma ORM:** Type-safe database access.
- **PostgreSQL:** Reliable relational database (hosted on Azure).
- **Socket.io:** Real-time bi-directional event-based communication.
- **Zod:** Schema declaration and validation.

### Frontend
- **React 18:** Modern UI library.
- **Vite:** Next-generation frontend tooling.
- **TailwindCSS:** Utility-first CSS framework for rapid UI development.
- **React Router:** Declarative routing for React applications.

### DevOps
- **Docker:** Containerized frontend and backend services.
- **Kubernetes (AKS):** Scalable orchestration for production deployment.
- **GitHub Actions:** Automated CI/CD pipeline.

## 🛠️ Local Development

### Prerequisites
- Node.js (v22+)
- Docker & Docker Compose
- A local PostgreSQL database or Docker installed.

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yasiru-101/Quirk.git
   cd Quirk
   ```

2. **Environment Variables:**
   - Copy `backend/.env.example` to `backend/.env` and fill in the required values.
   - For local development, `docker-compose.yml` provides a local PostgreSQL instance.

3. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   - The frontend will be available at `http://localhost:3000`
   - The backend API will be available at `http://localhost:5000`

### Manual Setup (Without Docker)

1. **Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🏗️ Production Deployment

Quirk is configured for deployment on Azure Kubernetes Service (AKS). The `.github/workflows/ci-cd.yml` file contains a complete CI/CD pipeline that builds Docker images, pushes them to Azure Container Registry (ACR), and deploys the Kubernetes manifests found in the `k8s/` directory.

### Initializing the Database

To seed the database with initial mock data:
```bash
cd backend
node scripts/seed.js
```

## 📄 License
This project is for educational purposes (University of Kelaniya - Semester 03 Web Application Development).
