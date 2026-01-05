# Vercel Deployment Guide for Flint Monolith

This guide explains how to deploy the Flint monolith (frontend + backend) to Vercel.

## Project Structure

```
flint/
├── frontend/     # Next.js application
├── backend/      # Express.js API (serverless functions)
├── shared/       # Shared types and validations
└── vercel.json   # Root Vercel configuration
```

## Deployment Options

### Option 1: Single Project Deployment (Recommended for Monolith)

Deploy both frontend and backend as a single Vercel project:

1. **Connect your repository to Vercel:**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Project Settings:**

   - **Framework Preset:** Next.js
   - **Root Directory:** Leave empty (root of repo)
   - **Build Command:** `cd frontend && npm run copy:shared && npm run build`
   - **Output Directory:** `frontend/.next`
   - **Install Command:** `cd frontend && npm install && cd ../backend && npm install && cd ../shared && npm install`

3. **Environment Variables:**
   Add all required environment variables in Vercel dashboard:

   - Backend variables (MongoDB, JWT secrets, etc.)
   - Frontend variables (API URLs, etc.)
   - Shared variables

4. **Deploy:**
   - Vercel will automatically detect the root `vercel.json`
   - Frontend will be served as Next.js app
   - Backend API routes will be available at `/api/*` and `/v1/*`

### Option 2: Separate Projects (Recommended for Independent Scaling)

Deploy frontend and backend as separate Vercel projects:

#### Frontend Project:

1. **Create Frontend Project in Vercel:**

   - Root Directory: `frontend`
   - Framework Preset: Next.js
   - Build Command: `npm run copy:shared && npm run build`
   - Install Command: `npm install && cd ../shared && npm install`

2. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app`)

#### Backend Project:

1. **Create Backend Project in Vercel:**

   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: `npm run copy:shared`
   - Install Command: `npm install && cd ../shared && npm install`

2. **Environment Variables:**
   - MongoDB connection string
   - JWT secrets
   - Other backend-specific variables

## Shared Code Handling

The shared code is automatically copied during build via:

- `postinstall` scripts in both frontend and backend
- `prebuild` scripts ensure shared code is copied before building
- Manual copy scripts: `npm run copy:shared` in each directory

## API Routing

### Single Project Setup:

- Frontend: Served at root `/`
- Backend API: Available at `/v1/*` (automatically routed to `/api/v1/*` which serves the Express app)
  - Example: `https://your-domain.vercel.app/v1/auth/login`
  - The rewrite maps `/v1/*` to `/api/v1/*`, and the Express app receives the full path with `/v1` prefix
  - The backend handler is at `backend/api/index.ts` and serves all `/api/*` requests

### Separate Projects Setup:

- Frontend: Your frontend domain (e.g., `https://flint.vercel.app`)
- Backend: Your backend domain (e.g., `https://flint-api.vercel.app`)

## Environment Variables

**📖 See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete guide**

### Quick Answer:

**For Single Project Deployment (Recommended):**
- ✅ **YES, combine ALL environment variables** from frontend and backend into one Vercel project
- Frontend variables must be prefixed with `NEXT_PUBLIC_` (exposed to browser)
- Backend variables should NOT have `NEXT_PUBLIC_` prefix (server-side only)

### Required Variables:

**Frontend (NEXT_PUBLIC_* - exposed to browser):**
```
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**Backend (Server-side only):**
```
CLIENT_URL=https://your-frontend-domain.vercel.app
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net
MONGO_DB=your-database-name
JWT_SECRET=your-jwt-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Optional (but recommended):**
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate
```

## Build Process

1. **Install dependencies:**

   - Shared package is installed first
   - Frontend and backend dependencies are installed
   - Shared code is copied via `postinstall` scripts

2. **Build:**

   - Frontend: Next.js build process
   - Backend: Shared code copied, TypeScript compiled by Vercel

3. **Deploy:**
   - Frontend: Static assets + serverless functions
   - Backend: Serverless function at `/api/index.ts`

## Troubleshooting

### Shared Code Not Found:

- Ensure `copy:shared` script runs before build
- Check that `postinstall` scripts are working
- Verify shared directory structure is correct

### Backend API Not Working:

- Check that `@vercel/node` is installed in backend
- Verify environment variables are set
- Check MongoDB connection string
- Review serverless function logs in Vercel dashboard

### Build Failures:

- Ensure all dependencies are installed
- Check that shared code is copied before TypeScript compilation
- Verify all environment variables are set

## Local Development

```bash
# Install all dependencies
npm run install:all

# Copy shared code
npm run copy:shared

# Run frontend
npm run dev:frontend

# Run backend (in another terminal)
npm run dev:backend
```

## CI/CD Integration

Vercel automatically deploys on:

- Push to main/master branch (production)
- Push to other branches (preview deployments)
- Pull requests (preview deployments)

You can also trigger deployments manually from the Vercel dashboard.

## Verification

Before deploying, you can verify your setup:

```bash
bash scripts/verify-deployment.sh
```

This script checks:

- All required files exist
- Shared code can be copied
- Dependencies are properly configured

## Notes

- The root `vercel.json` is configured for single project deployment
- Each subdirectory has its own `vercel.json` for separate project deployment
- Shared code must be copied before building either frontend or backend
- Backend runs as serverless functions with 30s max duration and 1024MB memory
- The backend API handler is at `backend/api/index.ts` and serves the Express app
- API routes are accessible at `/v1/*` which are rewritten to the backend handler
