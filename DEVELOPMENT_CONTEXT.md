# Development Context & System Architecture

> **Usage Instruction for Agent:**
> ⚠️ **CRITICAL:** At the start of every session, READ this file FIRST.
> This file is the **Source of Truth** for the project's architecture, state, and development conventions.
> Update this file at the end of every session to reflect new features, refactoring, or architectural decisions.

---

## 1. Project Overview
*   **Name:** Flint
*   **Goal:** A dating application (Tinder-like) with real-time video and voice calling capabilities.
*   **Type:** Monorepo-style Monolith (Frontend + Backend + Shared Code) using **NPM Workspaces**.
*   **Current Date:** January 7, 2026.

## 2. Tech Stack
### Backend (`/backend`)
*   **Runtime:** Node.js 20.x (Enforced)
*   **Language:** TypeScript
*   **Framework:** Express.js (Optimized for Vercel Serverless with direct entry point `api/index.ts`)
*   **Database:** MongoDB (Native Driver, **NO Mongoose**)
*   **Authentication:** JWT (Access Token), Google OAuth (Library: `google-auth-library`)
*   **Linting:** ESLint 9 (Legacy Mode Enabled via `ESLINT_USE_FLAT_CONFIG=false`)

### Frontend (`/frontend`)
*   **Framework:** Next.js 15.1.0 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS 4, Shadcn UI, Framer Motion
*   **State/Management:** React Hook Form, Zod, **UserContext**
*   **Linting:** ESLint 9 (Legacy Mode Enabled via `ESLINT_USE_FLAT_CONFIG=false`)

### Shared (`/shared`)
*   **Package Name:** `@flint/shared`
*   **Mechanism:**
    *   **Dev:** Linked via NPM Workspaces (symlinked).
    *   **Prod:** Copied via `copy-shared.sh` script during build for Vercel reliability.

---

## 3. Architecture & Conventions

### 3.1. Monorepo & Workspaces
*   **Management:** NPM Workspaces enabled in root `package.json`.
*   **Dependencies:** managed at workspace level, but Node version strictly pinned to `20.x` in root.
*   **Cross-Platform:** `package.json` MUST NOT contain platform-specific binaries (e.g., `@tailwindcss/oxide-linux...`). Rely on `package-lock.json` for resolution.

### 3.2. Vercel Deployment Strategy
*   **Project Structure:** Deployed as two separate Vercel projects ("Frontend" and "Backend").
*   **Root Directory Setting:**
    *   **Frontend Project:** `frontend` (Include source files from outside root: YES)
    *   **Backend Project:** `backend` (Include source files from outside root: YES)
*   **Framework Preset:**
    *   **Frontend:** Next.js
    *   **Backend:** **Other** (Do NOT use Next.js preset). Build command: `npm run build`. Output: `dist`.

### 3.3. Backend Standards
*   **Entry Point:** `backend/api/index.ts` must use **direct imports** (`import app from '../src/app'`) to ensure Vercel bundling works correctly. Dynamic `require` loops are forbidden.
*   **Structure:** Feature-based (`src/features/auth`, `src/features/profile`, etc.).
*   **Database:** Access via `src/data/db/index.ts`.

### 3.4. Frontend Standards
*   **Component Style:** Arrow Functions (`const Comp = () => {}`).
*   **Images:** Use `next/image` (`<Image />`) instead of `<img>` for performance.
*   **Imports:** STRICT case-sensitivity. Always verify file casing (e.g., `logo.tsx` vs `Logo.tsx`).

---

## 4. Current System State (Last Updated: Jan 7, 2026)
**Infrastructure Modernization & Fixes:**
1.  **Monorepo Restructuring:** Converted to **NPM Workspaces**. Root `package.json` now manages workspaces `frontend`, `backend`, and `shared`.
2.  **Dependency Alignment:**
    *   Standardized Node.js to `20.x` (LTS).
    *   Standardized Next.js to `15.1.0`.
    *   Standardized ESLint to `9` with Legacy Mode (`.eslintrc.json`) for stability.
3.  **Vercel Backend Fix:**
    *   Fixed "Routes Manifest" error by removing Next.js preset from Backend.
    *   Refactored `backend/api/index.ts` to remove fragile dynamic imports.
4.  **Cross-Platform Stability:**
    *   Removed hardcoded Linux/Mac binaries from `package.json`.
    *   Regenerated `package-lock.json` to support both macOS and Linux environments.
5.  **Build & Linting:**
    *   Fixed casing issues in imports (`Logo` -> `logo`).
    *   Fixed ESLint parser errors by reverting to `.eslintrc.json` and disabling Flat Config.
    *   Verified clean builds for both Frontend and Backend.

## 5. Next Development Steps
1.  **Media Integration:** Integrate Cloudinary for real Photo/Voice uploads.
2.  **Match UI:** Implement "It's a Match!" overlay.
3.  **Real-Time Chat:** Initialize Socket.IO in backend.

## 6. Critical Rules for Agent
*   **STRICT Node Version:** Do not change `engines: { "node": "20.x" }`.
*   **Platform Agnostic:** NEVER add `linux-x64` or `darwin-arm64` specific packages to `package.json`.
*   **Vercel Config:** NEVER change Backend Framework Preset to "Next.js". It must remain "Other".
*   **Imports:** Always check file casing before importing (macOS is case-insensitive, Vercel/Linux is NOT).
*   **Linting:** Maintain `ESLINT_USE_FLAT_CONFIG=false` until a full migration to Flat Config is planned.
*   **Workspaces:** Run commands via `npm run <cmd> --workspace=<name>` or from root with workspaces enabled.
