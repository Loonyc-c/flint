# Deployment Guide

This project is a monorepo consisting of a Next.js frontend and an Express/Node.js backend.

## 🏗 Architecture
- **Frontend**: Next.js 15 (Deploy on **Vercel**)
- **Backend**: Node.js + Socket.io + MongoDB (Deploy on **Render**)
  - *Note: The Backend requires a persistent server for Socket.io and In-Memory Queues (Live Call feature), so it cannot be deployed as a standard Serverless function.*

---

## 🚀 Backend Deployment (Render)
The backend should be deployed *first* so you have the API URL for the frontend configuration.

1.  **Create a New Web Service** on [Render](https://dashboard.render.com/).
2.  **Connect your GitHub repository**.
3.  **Configuration**:
    - **Name**: `flint-backend`
    - **Root Directory**: `.` (Keep as root, do NOT set to `backend` - Render needs root context for monorepo build)
    - **Environment**: `Node`
    - **Build Command**: `cd backend && npm install && npm run build`
    - **Start Command**: `cd backend && npm run start:prod`
    - **Plan**: Free (or higher for production performance)
4.  **Environment Variables**:
    Add the following variables in the Render dashboard:
    
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `NODE_ENV` | Environment Mode | `production` |
    | `PORT` | Server Port | `10000` |
    | `MONGO_URL` | MongoDB Connection String | `mongodb+srv://...` |
    | `MONGO_DB` | Database Name | `flint` |
    | `JWT_SECRET` | Secret for JWT Tokens | `your-secure-secret` |
    | `CLIENT_URL` | Frontend URL (Add after frontend deploy) | `https://your-app.vercel.app` |
    | `AGORA_APP_ID` | Agora App ID for Video/Audio | `...` |
    | `AGORA_APP_CERTIFICATE` | Agora Certificate | `...` |
    | `GOOGLE_CLIENT_ID` | Google OAuth ID | `...` |
    | `EMAIL_USER` | Email for notifications | `user@gmail.com` |
    | `EMAIL_PASS` | Email App Password | `...` |
    | `REDIS_URL` | (Optional) For Rate Limiting | `redis://...` |

---

## 🌐 Frontend Deployment (Vercel)
Once the backend is live, deploy the frontend.

1.  **Import Project** on [Vercel](https://vercel.com/new).
2.  **Select Directory**: Choose `frontend` as the root directory within the repo.
3.  **Build Settings**:
    - **Framework Preset**: Next.js
    - **Build Command**: `npm run copy:shared && npm run build` (This ensures shared types are copied before build)
    - **Output Directory**: `.next`
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
1.  **Update Backend**: After the frontend is deployed, go back to Render and update the `CLIENT_URL` environment variable with your new Vercel domain (e.g., `https://flint.vercel.app`).
2.  **Verify**: Open the Vercel URL.
    - Check the browser console for connection errors.
    - Test the "Live Call" feature to ensure Socket.io connects to the Render backend.

## 🛠 Troubleshooting
- **Shared Types Missing**: If the build fails saying it cannot find `@shared/types`, ensure the Build Command includes `npm run copy:shared`.
- **Socket Connection Failed**: Check if `NEXT_PUBLIC_SOCKET_URL` is set correctly without a trailing slash (usually) and matches the Render URL. Ensure `CLIENT_URL` on backend includes your Vercel domain to allow CORS.
