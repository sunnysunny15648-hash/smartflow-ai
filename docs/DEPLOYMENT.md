# SmartFlow AI - Production Deployment Guide

This guide details how to deploy SmartFlow AI for high availability:
- **Backend**: Render Web Service
- **Frontend**: Vercel Static Web Hosting
- **Database & Auth**: Supabase Cloud
- **AI Engine**: Google Gemini API

---

## 1. Deploy Backend to Render

1. Push your repository to GitHub or GitLab.
2. Sign in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Web Service**.
4. Connect your repository.
5. Configure the service parameters:
   - **Name**: `smartflow-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
6. Under **Environment Variables**, add the production secrets:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Port for Express server |
   | `FRONTEND_URL` | `https://your-smartflow-app.vercel.app` | Allowed CORS origin |
   | `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase API URL |
   | `SUPABASE_ANON_KEY` | `eyJhb...` | Supabase public anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhb...` | Supabase private service role key |
   | `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API Key |
   | `GEMINI_MODEL` | `gemini-2.5-flash` | Supported Gemini AI model |
   | `JWT_AUDIENCE` | `authenticated` | Supabase JWT audience |
7. Click **Create Web Service**.
8. Render will build and deploy the backend. Copy your service URL (e.g. `https://smartflow-ai-backend.onrender.com`).
9. Verify health by opening `https://smartflow-ai-backend.onrender.com/health` in your browser.

---

## 2. Deploy Frontend to Vercel

1. Sign in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New... → Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. In **Environment Variables**, configure the public Vite environment variables:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://smartflow-ai-backend.onrender.com/api/v1` | Your live Render backend URL |
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase API URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhb...` | Supabase public anon key |
6. Click **Deploy**.
7. Vercel will install dependencies, build the React app, and provide your production URL (e.g. `https://smartflow-ai.vercel.app`).
8. Notice that `frontend/vercel.json` contains SPA routing rewrites to ensure direct route visits (e.g. `/dashboard`, `/workflows`) work seamlessly without 404 errors.

---

## 3. Update Cross-Origin Resource Sharing (CORS)

Once Vercel provides your frontend domain:
1. Go back to Render Dashboard → `smartflow-ai-backend` → **Environment**.
2. Update `FRONTEND_URL` with your exact live Vercel domain (e.g. `https://smartflow-ai.vercel.app`).
3. Render will redeploy automatically with strict CORS matching your production domain.

---

## 4. Production Verification Checklist

- [ ] Open frontend URL: Landing page renders cleanly.
- [ ] User Sign Up: Create test account and verify profile trigger runs in Supabase.
- [ ] Dashboard: Verify summary stats and charts retrieve real data from Supabase.
- [ ] Workflow Creation: Create a test workflow and verify steps appear on timeline.
- [ ] Tasks: Move tasks across Kanban board columns and verify state persists on reload.
- [ ] Approvals: Submit approval request and verify manager decision buttons work.
- [ ] Automation: Trigger an event (e.g., mark task overdue or create task) and check `/automation` execution logs.
- [ ] Gemini AI: Ask the AI Assistant to generate a workflow and click "Apply as Workflow".
- [ ] Reports: Generate operational report and download CSV export.
- [ ] Security: Verify user from Organization A cannot view or access data from Organization B.

