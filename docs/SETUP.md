# SmartFlow AI - Local Development Setup Guide

Follow this step-by-step guide to run SmartFlow AI locally on your development machine.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **Supabase Account**: Free project on [supabase.com](https://supabase.com)
- **Google AI Studio Key**: Free API key from [aistudio.google.com](https://aistudio.google.com)

---

## 1. Supabase Database Configuration

1. Log in to [Supabase](https://supabase.com) and create a new project (e.g. `smartflow-ai`).
2. Navigate to the **SQL Editor** tab in your Supabase project dashboard.
3. Open the file `supabase/migrations/20250101000000_smartflow_init.sql` from this codebase.
4. Paste the entire SQL script into the Supabase SQL Editor and click **Run**.
5. This creates:
   - All 17 tables with constraints, indexes, and cascades.
   - Automatic user profile synchronization trigger (`handle_new_user`).
   - Reusable `updated_at` triggers.
   - Row Level Security (RLS) helper functions and complete isolation policies.
6. Retrieve your project credentials from **Project Settings → API**:
   - `Project URL`
   - `anon public key`
   - `service_role secret key` (Keep private, backend only!)

---

## 2. Environment Variables Configuration

### Backend Setup
Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# JWT Configuration
JWT_AUDIENCE=authenticated
```

### Frontend Setup
Create `frontend/.env` (or copy from `frontend/.env.example`):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

---

## 3. Install Dependencies & Run

You can run both services easily from the root workspace:

```bash
# Install dependencies for both backend and frontend
npm run install:all

# Start Backend Server (runs on http://localhost:5000)
npm run dev:backend

# In a separate terminal, start Frontend Dev Server (runs on http://localhost:5173)
npm run dev:frontend
```

Alternatively, run in separate folders:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 4. Initial User & Workspace Creation

1. Open `http://localhost:5173` in your browser.
2. Click **Get Started Free** or go to `http://localhost:5173/register`.
3. Enter your Name, Organization Name, Email, and Password.
4. SmartFlow AI registers the account in Supabase Auth, triggers the PostgreSQL profile creation, creates the organization, assigns you as **Admin**, and automatically seeds default departments (`Operations`, `Human Resources`, `Finance`, `IT & Engineering`).
5. You are redirected to your live **SmartFlow AI Dashboard**!

