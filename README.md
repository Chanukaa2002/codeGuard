# CodeGuard AI

CodeGuard AI is an AI-assisted code review platform. Developers connect their GitHub repositories, select a branch, and run automated code analysis. The system combines static code analysis, security scanning, duplicate code detection, and AI-powered explanations.

## Architecture

This project is a monorepo containing multiple services:

- **Frontend (`/frontend`)**: Next.js 15 application with TypeScript, Tailwind CSS, shadcn/ui, and TanStack Query.
- **Backend (`/backend`)**: ExpressJS application with TypeScript, Prisma ORM, and Supabase PostgreSQL.
- **Worker (`/worker`)**: Separate Node.js application for background processing and long-running code review tasks (static analysis tools).
- **Docs (`/docs`)**: Documentation for the project.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (via Supabase)
- GitHub OAuth App (for authentication)
- OpenRouter API Key (for AI explanations)

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd codeguard-ai
   ```

2. **Setup Environment Variables:**
   Copy the `.env.example` files to `.env` in each respective directory and fill in the required credentials.
   ```bash
   # In frontend/
   cp .env.example .env.local

   # In backend/
   cp .env.example .env

   # In worker/
   cp .env.example .env
   ```

3. **Install Dependencies:**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   
   # Setup Prisma (Backend)
   npx prisma generate
   npx prisma db push

   # Worker
   cd ../worker
   npm install
   ```

4. **Running the Services:**

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Runs on http://localhost:3000

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Runs on http://localhost:3001 (or configured port)

   **Worker:**
   ```bash
   cd worker
   npm run dev
   ```

## Development Rules
- Use clean architecture
- Use modular design
- Use SOLID principles
- Use TypeScript strict mode
- Write production-quality code
- Avoid unnecessary complexity
