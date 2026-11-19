# CampusExam AI - Render Deployment Guide 🚀
## Complete Step-by-Step Guide for Free 1-Click Live Deployment on Render

This project is fully optimized and configured for **Render** (`https://render.com`).
It can be deployed as a single unified service (Frontend + Backend + Database + WebSockets) on Render's **Free Tier** without paying anything.

---

## 📋 Prerequisites
1. A free account on **GitHub** ([github.com](https://github.com))
2. A free account on **Render** ([render.com](https://render.com))

---

## Step 1: Push Project to GitHub

Open terminal / PowerShell in `CampusExam-AI` folder and run:

1. Create a new repository on GitHub named `campusexam-ai` (keep it Public or Private).
2. Connect and push your code:
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/campusexam-ai.git
git branch -M main
git push -u origin main
```

*(All project files, package configurations, and `render.yaml` are already committed and ready to push!)*

---

## Step 2: Deploy on Render (Choose Any One Option)

### 🌟 Option A: Automatic Blueprint (Recommended - 1 Click!)
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click the **"New +"** button at the top right.
3. Select **"Blueprint"**.
4. Connect your GitHub repository (`campusexam-ai`).
5. Render will automatically read `render.yaml` from your repo.
6. Click **"Apply"**.
7. Render will build the React Vite frontend, compile the backend TypeScript, set up the database with all seeded MCQs, and launch your live website!

---

### 🛠️ Option B: Manual Web Service
If you prefer configuring it manually:
1. In Render Dashboard, click **"New +"** -> **"Web Service"**.
2. Select your GitHub repository (`campusexam-ai`).
3. Fill in the following settings:
   - **Name**: `campusexam-ai` (or your preferred name)
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Region**: `Oregon (US West)` or `Singapore`
   - **Build Command**:
     ```bash
     npm run render:build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free`

4. Click **"Advanced"** and add these **Environment Variables**:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render standard port |
   | `DATABASE_URL` | `file:./dev.db` | Auto-configured SQLite database |
   | `JWT_SECRET` | `campusexam_super_secret_jwt_key_2026` | Token encryption secret |
   | `CLIENT_ORIGIN` | `*` | Permits your live Render domain |

5. Click **"Deploy Web Service"**.

---

## Step 3: Your Live Website is Ready! 🎉

Once the build finishes (typically 2-3 minutes), Render will give you a public URL:
👉 **`https://campusexam-ai.onrender.com`**

### Pre-Seeded Live Credentials:
- **Student**: `student1@campusexam.edu` / `Student@123`
- **Faculty**: `prof.sharma@campusexam.edu` / `Faculty@123`
- **Admin**: `admin@campusexam.edu` / `Admin@123`
*(Or click the 1-click Quick Login demo buttons right on the login page!)*
