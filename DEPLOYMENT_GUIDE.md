# Deployment Guide

This project is a **monorepo** consisting of a Next.js frontend and an Express/Node.js backend.
Because it uses npm workspaces and shared code, deployment requires specific configuration to ensure dependencies resolve correctly.

## 🏗 Architecture
- **Frontend**: Next.js 15 (Deploy on **Vercel**)
- **Backend**: Node.js + Socket.io + MongoDB (Deploy on **Render**)
- **Shared**: Common types and validation logic (Located in `shared/`, copied to apps during build)

> ⚠️ **Critical Requirement**: The Backend requires a persistent server for Socket.io connections. **Do not deploy as a Serverless Function.**

---

## 🚀 Backend Deployment (Render)
The backend must be deployed *first* to generate the API URL required for the frontend.

1.  **Create a New Web Service** on [Render](https://dashboard.render.com/).
2.  **Connect your GitHub repository**.
3.  **Configuration**:
    - **Name**: `flint-backend`
    - **Root Directory**: `.` (Leave default. **Crucial** for workspace resolution)
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build --workspace=backend`
    - **Start Command**: `cd backend && npm run start:prod`
    - **Plan**: **Starter** or higher (Free tier spins down, disconnecting active socket calls).
4.  **Environment Variables**:
    
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `NODE_ENV` | Environment Mode | `production` |
    | `PORT` | Server Port | `10000` |
    | `MONGO_URL` | MongoDB Connection String | `mongodb+srv://...` |
    | `MONGO_DB` | Database Name | `flint` |
    | `JWT_SECRET` | Secret for JWT Tokens | `your-secure-secret` |
    | `CLIENT_URL` | Allowed Frontend Origin(s) (Comma separated) | `https://your-app.vercel.app` |
    | `REDIS_URL` | **Required for Production** (Rate Limiting & Queues) | `redis://...` |
    | `AGORA_APP_ID` | Agora App ID | `...` |
    | `AGORA_APP_CERTIFICATE` | Agora Certificate | `...` |
    | `GOOGLE_CLIENT_ID` | Google OAuth ID | `...` |
    | `EMAIL_USER` | Email for notifications | `user@gmail.com` |
    | `EMAIL_PASS` | Email App Password | `...` |

5.  **Health Check**:
    - Render may ask for a health check path. Use: `/` (Returns status 200).

---

## 🌐 Frontend Deployment (Vercel)
Once the backend is live, deploy the frontend.

1.  **Import Project** on [Vercel](https://vercel.com/new).
2.  **Project Configuration** (Critical for Monorepo):
    - **Root Directory**: `.` (Do **NOT** change this to `frontend`. Vercel needs the root `package.json` to resolve workspaces).
    - **Framework Preset**: Next.js
3.  **Build Settings** (Override Default):
    - **Build Command**: `cd frontend && npm run build`
        - *Note: The `postinstall` script in `frontend/package.json` will automatically copy shared types.*
    - **Output Directory**: `frontend/.next`
4.  **Environment Variables**:
    
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `NEXT_PUBLIC_API_URL` | Backend API URL | `https://flint-backend.onrender.com/v1` |
    | `NEXT_PUBLIC_SOCKET_URL` | Backend Socket URL | `https://flint-backend.onrender.com` |
    | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth ID | `...` |
    | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Name | `...` |
    | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| Cloudinary Preset | `...` |

---

## 🔄 Final Steps
1.  **Update Backend CORS**: After the frontend is deployed, copy the assigned Vercel domain (e.g., `https://flint-app.vercel.app`).
2.  **Configure Render**: Go to your Render Dashboard > Environment Variables and update `CLIENT_URL`:
    ```
    CLIENT_URL=https://flint-app.vercel.app
    ```
    *You can add multiple domains comma-separated for staging/preview URLs.*
3.  **Verify**:
    - Open the Vercel URL.
    - Check the browser console. If you see `Socket connected`, the integration is successful.
    - If you see `CORS` errors, ensure the protocol (`https://`) is included in `CLIENT_URL`.

## 🛠 Troubleshooting
- **Build Failures (Module not found)**: Ensure you are running `npm install` at the **Root** level in your build commands. The workspace relies on the root `node_modules` and `package-lock.json`.
- **Socket Disconnects**: If using Render's Free tier, the server sleeps after inactivity. Upgrade to a paid plan for reliable real-time features.
- **CORS Errors**: Ensure `CLIENT_URL` has no trailing slash (unless your code handles it) and matches the browser's origin exactly.

