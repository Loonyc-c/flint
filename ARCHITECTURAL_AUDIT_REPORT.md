# Architectural Audit & Modernization Report

## 1. Dependency Audit & Modernization

### Critical Findings
- **Version Mismatch:** 
  - Root `package.json` specifies `next: ^15.3.4`.
  - Frontend `package.json` specifies `nexßt: 16.1.1`.
  - **Risk:** High. Running `npm install` in root might hoist a different version than what the frontend expects, causing "Invalid Hook Call" or hydration errors.
- **No Workspace Configuration:**
  - The project uses a "scripts-based" monorepo approach (`cd frontend && npm install`).
  - **Risk:** High. This leads to bloated `node_modules` (3 separate copies), inconsistent versions, and no lockfile protection for the actual sub-projects when installed via root.

### Recommendations
1. **Enable NPM Workspaces:**
   Modify root `package.json` to manage dependencies efficiently.
   ```json
   {
     "workspaces": ["frontend", "backend", "shared"]
   }
   ```
2. **Standardize Next.js Version:**
   Pin `next` to the latest stable LTS (Recommend `15.x` as `16.x` might be too bleeding edge/beta depending on actual release status in 2026). If `16.1.1` is stable, ensure ROOT matches FRONTEND.
3. **Remove Duplicate Scripts:**
   With workspaces, `install:all` becomes just `npm install` in the root.

---

## 2. Vercel Configuration & "Routes Manifest" Fix

### The Error
`routes-manifest.json couldn't be found`

### Root Cause
This error is specific to Next.js. It appears in your **Backend** deployment logs because Vercel is trying to build the Backend as a Next.js application.
- Vercel detects `package.json` in the root (which contains `next`) or defaults to "Next.js" preset.
- It looks for `.next/routes-manifest.json` after build, which doesn't exist for an Express app.

### Configuration Fixes

#### A. Project Settings (In Vercel Dashboard)
You must configure the **Backend** project explicitly:
1. Go to **Settings > Build & Development settings**.
2. **Framework Preset:** Change from `Next.js` (or `Automatic`) to **`Other`**.
3. **Root Directory:** Ensure this is set to `backend`.
4. **Build Command:** `npm run build` (This matches your `backend/package.json`).
5. **Output Directory:** `dist` (or leave default if not serving static files).

#### B. `backend/api/index.ts` Refactor
The current "hunt-and-peck" logic for finding `dist` is fragile and breaks Vercel's static analysis (NFT).
**Recommended Change:** Import the app directly. Vercel compiles TS on the fly for Serverless Functions.

**New `backend/api/index.ts`:**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app'; // Direct import
import { getDbConnection } from '../src/data/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup...
  await getDbConnection();
  return app(req, res);
}
```
*Note: This requires ensuring `src/app.ts` exports the express app as default.*

---

## 3. Cross-Platform & Environment Stability

### Issues
- **`copy-shared.sh`:** Manual file copying is error-prone and OS-dependent (Windows users need Git Bash).
- **Global Dependencies:** Relying on global `ts-node` or `vercel` CLI can cause version drift.

### Action Plan
1. **Docker for Development:**
   Create a `docker-compose.yml` to run Frontend, Backend, and MongoDB locally. This guarantees that "it works on my machine" means "it works on Linux".
2. **Symlinks instead of Copy (Dev Only):**
   In `npm workspaces`, the `shared` package is symlinked. You don't need to copy files manually. You can import `@flint/shared` directly.
   - **Fix:** Rename `shared` package to `@flint/shared` (already done).
   - **Fix:** Add `"@flint/shared": "*"` to frontend/backend dependencies.
   - **Fix:** Run `npm install`.

## 4. Integration Strategy (Express + Next.js)

To ensure the Frontend talks to the Backend reliably:
1. **Environment Variables:**
   - Frontend needs `NEXT_PUBLIC_API_URL`.
   - On Vercel, for the Frontend project, set this to the **Backend's Production URL** (e.g., `https://flint-backend.vercel.app`).
2. **CORS:**
   - Your backend already handles CORS. Ensure `CLIENT_URL` env var in Backend matches the Frontend URL.
