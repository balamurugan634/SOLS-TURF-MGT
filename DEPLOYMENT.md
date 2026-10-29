# TurfHub – Deployment Guide (Frontend on Render + Backend on Vercel)

This guide walks you through deploying **TurfHub** with:
- **Backend**: Deployed to **Vercel** (Serverless Python/Django REST API)
- **Frontend**: Deployed to **Render** (High-performance Static Site)
- **Database**: Cloud PostgreSQL (e.g. Free [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com))

---

## 🏗️ Architecture Overview

```mermaid
graph LR
    User[Browser Client]
    Render[Render: React Frontend]
    Vercel[Vercel: Django REST API]
    Neon[Neon / Supabase: PostgreSQL]

    User -->|Visits Web App| Render
    User -->|API Requests /api/*| Vercel
    Vercel -->|Persistent Data| Neon
```

---

## Part 1: Prerequisites & Database Setup

> [!IMPORTANT]
> **Why Cloud PostgreSQL on Vercel?**  
> Vercel runs Python backend code in serverless lambdas with a read-only, ephemeral filesystem. Local SQLite (`db.sqlite3`) will not persist booking data across requests. Using a free cloud PostgreSQL database guarantees full ACID persistence.

1. Go to [Neon.tech](https://neon.tech) (or [Supabase.com](https://supabase.com)) and create a free account.
2. Create a new project named `turfhub`.
3. Copy your PostgreSQL Connection String (`DATABASE_URL`), which looks like:
   ```
   postgresql://username:password@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Part 2: Deploy Backend to Vercel

### Step 1: Push Code to GitHub
Ensure all changes from this repository are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure deployment for Render frontend and Vercel backend"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New..." > "Project"**.
2. Select your `SOLS-TURF-MGT` (or `turf`) repository.
3. In **Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: Click `Edit` and select `backend` *(Note: `vercel.json` is configured to work whether you set Root Directory to `backend` or leave it at the project root)*.
4. In **Environment Variables**, add:

| Key | Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require` | Your Neon/Supabase PostgreSQL connection string |
| `SECRET_KEY` | `turfhub-super-secret-key-prod-2026-change-me` | Django secret key |
| `DEBUG` | `False` | Production mode |
| `ALLOWED_HOSTS` | `*` | Or specify `your-vercel-domain.vercel.app` |
| `DEPLOY_SECRET` | `turfhub-deploy-secret-2026` | Secret key used to initialize database |

5. Click **"Deploy"**.

### Step 3: Initialize & Seed Database (1-Click)
Once Vercel finishes the build, your API will be live at: `https://<your-backend>.vercel.app`.

To automatically run Django migrations and insert all sample turfs, demo users, and dynamic pricing rules:
1. Open this URL in your browser:
   ```
   https://<your-backend>.vercel.app/api/setup-db/?secret=turfhub-deploy-secret-2026
   ```
   *(Replace with the `DEPLOY_SECRET` you set in Step 2)*
2. You will receive a JSON response:
   ```json
   {
     "status": "success",
     "message": "Database migrated and seeded successfully with demo accounts!"
   }
   ```
3. Test your health check:
   ```
   https://<your-backend>.vercel.app/api/health/
   ```

---

## Part 3: Deploy Frontend to Render

### Step 1: Create a Static Site on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **"New +"** in the top navigation and select **"Static Site"**.
3. Connect your GitHub repository.

### Step 2: Configure Build Settings
Fill in the following fields:

- **Name**: `turfhub-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Step 3: Add Environment Variables
Under the **Environment Variables** section, click **"Add Environment Variable"**:

- **Key**: `VITE_API_URL`
- **Value**: `https://<your-backend>.vercel.app`  *(Your Vercel backend URL from Part 2)*

> [!NOTE]
> `frontend/public/_redirects` is already included (`/* /index.html 200`), so client-side routing with React Router (e.g. `/admin`, `/login`, `/turfs/1`) works on page refresh without extra configuration.

### Step 4: Deploy
Click **"Create Static Site"**. Render will build and deploy your React frontend.

---

## Part 4: Verification & Demo Accounts

Once deployed, visit your Render URL (e.g., `https://turfhub-frontend.onrender.com`).

You can test logging in using the **1-Click Demo Switcher** in the navigation bar or using:

| Role | Email | Password |
|---|---|---|
| **Platform Admin** | `admin@turfhub.com` | `admin123` |
| **Turf Owner** | `owner.greenfield@turfhub.com` | `owner123` |
| **New Turf Owner** | `newowner@turfhub.com` | `tempPass#2026` *(Triggers mandatory password reset)* |
| **Customer** | `john.doe@example.com` | `customer123` |

---

## 🛠️ Summary of Files Configured

- `frontend/src/services/api.ts`: Configured to use `import.meta.env.VITE_API_URL` in production while falling back to `/api` locally.
- `frontend/public/_redirects`: Enables SPA client-side routing on Render.
- `backend/requirements.txt`: Python dependencies (`Django`, `djangorestframework`, `dj-database-url`, `whitenoise`, `psycopg2-binary`, `gunicorn`).
- `backend/vercel.json` & `vercel.json`: Vercel serverless Python configuration.
- `backend/config/settings.py`: Added PostgreSQL database URL parsing, WhiteNoise static files, CORS, and CSRF trusted origins.
- `backend/turfhub_api/views.py`: Added `/api/health/` and `/api/setup-db/` for serverless initialization.
- `render.yaml`: Optional Render Blueprint configuration.
