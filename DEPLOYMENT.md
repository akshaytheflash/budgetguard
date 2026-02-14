# How to Host BudgetGuard on Vercel

Since this is a monorepo with both a Python backend and a React frontend, we have configured it to work with Vercel's serverless infrastructure.

## ⚠️ Important Note About Database
This app uses **SQLite** (`budgetguard.db`). On Vercel's serverless environment, the filesystem is **read-only** and **ephemeral**.
- We have configured the app to copy the database to `/tmp` (which is writable) on startup.
- **DATA WILL NOT PERSIST** between deployments or after the serverless function goes idle (usually after 10-15 minutes of inactivity).
- This is fine for a **Demo** or **Presentation**.
- For a real production app, you should use a cloud database like **Vercel Postgres** or **Neon**.

## Deployment Steps

1. **Install Vercel CLI** (Optional, or use the web dashboard)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   Run the following command in the root `budgetguard` folder:
   ```bash
   vercel
   ```
   - Follow the prompts.
   - Link to existing project? [N]
   - In which directory is your code located? [./]
   - Want to modify these settings? [N]

3. **Web Dashboard Method**
   - Push this code to GitHub.
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your GitHub repository.
   - **Framework Preset**: Vercel should detect it automatically or select `Other`.
   - **Root Directory**: `.` (Keep as root).
   - **Build Command**: `npm install --prefix web && npm run build --prefix web` (Vercel might try to auto-detect `web`, but since we have `vercel.json`, it should handle `frontend` and `backend` separately).
     - *Actually, with `vercel.json` configured, standard `vercel` deploy should just work.*

## Environment Variables
If you use the `Scam Detector` functionality in a real deployment, remember to add your GEMINI_API_KEY to Vercel's environment variables settings.
