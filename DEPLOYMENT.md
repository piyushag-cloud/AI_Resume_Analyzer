# Deployment Guide - AI Resume Analyzer

This guide details how to deploy the full-stack AI Resume Analyzer application to production.

---

## 1. Backend Deployment (Flask API)

The backend can be deployed to platforms like **Render**, **Railway**, **Heroku**, or any Linux Virtual Private Server (VPS).

### Deploying on Render
1. **Create Web Service**: Connect your GitHub repository to Render and create a new **Web Service**.
2. **Build Settings**:
   - **Runtime**: `Python`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
3. **Environment Variables**:
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: *[A custom random secure key]*
4. **Persistent Storage (SQLite Database)**:
   - SQLite writes to a local file (`backend/resume_analyzer.db`). Cloud hosting platforms like Render have ephemeral filesystems, meaning this database file will reset on every deploy or restart.
   - **Recommendation**: To keep SQLite, mount a **Persistent Disk** on Render and configure the database path to reside on the persistent disk (e.g., in `database.py`). Alternatively, you can easily adapt the database helper connection in `backend/database.py` to use a cloud PostgreSQL database.

---

## 2. Frontend Deployment (React App)

The frontend is a static React application built using Vite, making it perfect for free static hosting platforms like **Vercel** or **Netlify**.

### Deploying on Vercel
1. **Create Project**: Connect your GitHub repository to Vercel and create a new project.
2. **Build Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - Add the environment variable `VITE_API_URL` and set it to your deployed production backend service URL (e.g. `https://your-backend-service.onrender.com/api`).
4. Click **Deploy**. Vercel will build the production bundle and host the application.
