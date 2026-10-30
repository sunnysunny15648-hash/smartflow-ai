# SmartFlow AI – Intelligent Business Workflow Automation Platform

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini%20(@google/genai)-4285f4?logo=google)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SmartFlow AI is a production-grade, enterprise SaaS business workflow automation platform engineered to eliminate manual operational bottlenecks. Powered by **Google Gemini AI**, **Supabase PostgreSQL**, **Node.js Express**, and **React + Vite**, it converts manual processes into structured, automated, measurable, and intelligent workflows.

---

## 🌟 Core Features

- **Multi-Tenant Architecture**: Complete data isolation using Supabase PostgreSQL **Row-Level Security (RLS)** and Role-Based Access Control (`admin`, `manager`, `employee`, `viewer`).
- **Dynamic Workflow Pipelines**: Sequential process milestones with department ownership, role-based handoffs, and progress tracking.
- **Rule-Based Automation Engine**: Backend-driven **Trigger → Condition → Action** automation engine with idempotency keys, execution logs, failure handling, and retry-safety.
- **Interactive Task Management**: Dual Kanban Board & Table views, interactive checklists, real-time status transitions, discussion comments, and verified file attachments.
- **Approval Hierarchy**: Purchase, expense, leave, and operational requisitions with manager approval workflows and anti-self-approval protection.
- **Google Gemini AI Assistant**: Official `@google/genai` integration for natural-language workflow generation, task breakdown synthesis, bottleneck detection, and report summarization.
- **Business Analytics & CSV Export**: Real-time KPI dashboards, Recharts visual distributions, automated operational reports, and instant CSV downloads.
- **Immutable Audit Trail**: Compliance-grade audit logging capturing actor, action, timestamps, and JSON metadata.

---

## 🏗️ Architecture & Project Structure

```
bulidtoship/
├── backend/                        # Node.js + Express REST API
│   ├── src/
│   │   ├── config/                 # Supabase & Environment Zod schema
│   │   ├── controllers/            # Modular route controllers
│   │   ├── jobs/                   # Node-cron deadline checker job
│   │   ├── middleware/             # Auth, RBAC, Validation, Error Handler
│   │   ├── routes/                 # REST API endpoints under /api/v1
│   │   ├── services/               # Gemini AI, Automation Engine, Workflows, Tasks
│   │   ├── utils/                  # Structured logger & standard responses
│   │   ├── validators/             # Zod input/output schemas
│   │   ├── app.js                  # Express app setup (Helmet, CORS, Rate Limit)
│   │   └── server.js               # Entry point with graceful shutdown
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── render.yaml                 # Render Web Service Blueprint
│
├── frontend/                       # React.js + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/             # Reusable UI (Button, Modal, Card, Badge, etc.)
│   │   │   ├── common/
│   │   │   └── layout/             # Sidebar, TopNavbar, ProtectedRoute, AppLayout
│   │   ├── context/                # AuthContext (Supabase Auth) & NotificationContext
│   │   ├── pages/                  # Dashboard, Workflows, Tasks, Approvals, Automation, AI
│   │   ├── routes/                 # AppRoutes with role protection
│   │   ├── services/               # Axios API client & Supabase client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json                 # Vercel SPA Routing Configuration
│
├── supabase/
│   ├── migrations/
│   │   └── 20250101000000_smartflow_init.sql # Complete SQL Schema & RLS Policies
│   └── seed.sql                    # Initial seed helper functions
│
├── docs/                           # Documentation
│   ├── API.md                      # Complete /api/v1 endpoint reference
│   ├── DATABASE.md                 # Schema, ERD, and RLS policies
│   ├── SETUP.md                    # Local setup guide
│   └── DEPLOYMENT.md               # Render & Vercel deployment guide
│
├── .gitignore
├── package.json                    # Root workspace convenience scripts
└── README.md
```

---

## 🔑 Environment Variables

Both `frontend/` and `backend/` have separate, independent `.env` files.

### 1. Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only private key (NEVER expose to frontend) | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Google Gemini AI Key | Obtain free from [Google AI Studio](https://aistudio.google.com) |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `JWT_AUDIENCE` | Supabase JWT audience | `authenticated` |

### 2. Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api/v1` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | `eyJhbGciOi...` |

---

## 🚀 Quick Start (Local Development)

### 1. Database Setup
1. Create a free project on [Supabase](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/20250101000000_smartflow_init.sql` and run it.
   - This creates all 17 tables, indexes, triggers, and Row Level Security policies.

### 2. Configure Environment Files
Copy example files to `.env` in both folders and fill in your Supabase keys:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Install & Run
Run from the workspace root:
```bash
# 1. Install all dependencies
npm run install:all

# 2. Start Backend Server (runs on http://localhost:5000)
npm run dev:backend

# 3. In another terminal, start Frontend (runs on http://localhost:5173)
npm run dev:frontend
```

---

## 🌐 Production Deployment Guide

### A. Deploy Frontend to Vercel

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New → Project**.
3. Import your repository and configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://smartflow-ai-backend.onrender.com/api/v1`
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your_supabase_anon_key`
5. Click **Deploy**. Vercel will build and host your frontend.
   *(Note: `frontend/vercel.json` ensures client-side routing works cleanly on page refreshes).*

---

### B. Deploy Backend to Render

1. Sign in to [Render](https://render.com) and click **New + → Web Service**.
2. Connect your repository and configure:
   - **Name**: `smartflow-ai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `FRONTEND_URL`: `https://your-smartflow-frontend.vercel.app`
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: `your_supabase_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your_supabase_service_role_key`
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `JWT_AUDIENCE`: `authenticated`
4. Click **Create Web Service**. Your backend will build and start.

---

## 🛡️ Security Architecture

1. **Service Role Confidentiality**: The Supabase `service_role` key and `GEMINI_API_KEY` exist exclusively on the Express backend and are never bundled into frontend assets.
2. **Row-Level Security (RLS)**: Enforced directly inside PostgreSQL. Even with raw SQL execution, tenants cannot view records outside their active organization.
3. **Anti-Self-Approval**: Prevention logic blocks users from approving their own financial or process requests.
4. **Idempotency Guarantees**: Automation rules enforce a unique `(rule_id, event_id)` constraint in PostgreSQL to guarantee single-execution safety.
5. **Prompt Injection Mitigation**: Strict system instructions and Zod schema validations treat all AI model responses as untrusted data before processing.

---

## 📄 License
This project is licensed under the MIT License.

