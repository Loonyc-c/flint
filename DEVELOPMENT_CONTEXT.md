# Development Context & System Architecture

> **Usage Instruction for Agent:**
> ⚠️ **CRITICAL:** At the start of every session, READ this file FIRST.
> This file is the **Source of Truth** for the project's architecture, state, and development conventions.
> Update this file at the end of every session to reflect new features, refactoring, or architectural decisions.

---

## 1. Project Overview
*   **Name:** Flint
*   **Goal:** A dating application (Tinder-like) with real-time video and voice calling capabilities.
*   **Type:** Monorepo-style Monolith (Frontend + Backend + Shared Code).
*   **Current Date:** January 5, 2026.

## 2. Tech Stack
### Backend (`/backend`)
*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Framework:** Express.js (Refactored for **Vercel Serverless Functions**)
*   **Database:** MongoDB (Native Driver, **NO Mongoose**)
*   **Authentication:** JWT (Access Token), Google OAuth (Library: `google-auth-library`)
*   **Real-time:** Ready for Socket.IO (Server initialized with `http.createServer`)

### Frontend (`/frontend`)
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS 4, Shadcn UI
*   **State/Management:** React Hook Form, Zod, **UserContext (Custom Provider)**
*   **HTTP Client:** Custom `apiRequest` wrapper with auto-injection of `Authorization` headers.

### Shared (`/shared`)
*   Contains **Zod Schemas** (`validations`), **TypeScript Interfaces** (`types`), and **Logic** (`lib`).
*   **Mechanism:** A shell script (`copy-shared.sh`) copies these files into `backend/src/shared-types` and `frontend/src/shared-types`.

---

## 3. Architecture & Conventions

### 3.1. Directory Structure (Feature-Based)
Both Frontend and Backend enforce a **Feature-Based** architecture.

**Backend Structure:**
```text
backend/
├── api/                <-- Vercel Serverless Entry Point
├── src/
│   ├── app.ts          <-- Express App Instance
│   ├── index.ts        <-- Local Dev Entry Point
│   ├── features/
│   │   ├── auth/
│   │   ├── profile/
│   │   └── matches/
│   ├── routes/
│   │   ├── public/
│   │   └── protected/
│   └── data/
```

### 3.2. Frontend Standards
*   **Component Style:** All components MUST use **Arrow Functions** (`const Comp = () => {}`).
*   **Generic Components:** Use `src/components/ui/form-input.tsx` for form fields to ensure consistent label/error handling.
*   **Global State:** Use `useUser()` from `UserContext` to access decoded JWT metadata (id, email, names).
*   **API Client:** `apiRequest` automatically pulls the token from `localStorage` if available.

### 3.3. Database Access
*   **Collections:** `users`, `interactions` (swipes), `matches`.
*   **Security:** Password reset tokens are hashed (SHA-256) before storage.
*   **Performance:** All "N+1" query patterns (especially in match enrichment) are forbidden. Use `$in` queries with projections.

### 3.4. Profile Completeness Logic
*   **Rule:** Users MUST have a completeness score of **>= 80%** to see others (Discovery) or swipe (Matching).
*   **Base (50%):** Mandatory fields (Nickname, Age, Gender, 1 Photo, Voice Intro).
*   **Bonus (50%):** Optional fields (Extra photos, Questions, Bio, Interests).
*   **Calculation:** Handled by a shared library `shared/lib/profile/calculator.ts`.

---

## 4. Current System State (Last Updated: Jan 5, 2026)
**Auth & Profile Systems Hardened:**
1.  **Backend Security:** Reset tokens are now hashed. Email uniqueness is enforced at the service level.
2.  **User Context:** Frontend now decodes JWT metadata upon login and persists state via `UserProvider`.
3.  **Standardized UI:** Auth forms refactored into a generic `AuthFormWrapper` with `FormInput` components.
4.  **Profile Dashboard:** Implemented a modern, non-linear "Shiny" Profile Page (`/profile`) with:
    *   Real-time completeness meter (animated via `framer-motion`).
    *   Modular architecture (PhotoGrid, InterestsModal, QuestionsModal, etc.).
    *   Integration with backend `GET/PUT /v1/profile` endpoints.
5.  **Deployment Ready:** Both `frontend` and `backend` are configured with `vercel.json` and optimized `next.config.ts` for immediate Vercel deployment.

## 5. Next Development Steps
1.  **Media Integration:**
    *   Integrate Cloudinary for real Photo and Voice uploads (replacing current local mocks).
2.  **Profile Auto-Save:**
    *   Implement debounced auto-save on the Profile Dashboard.
3.  **Matching & Discovery UI:**
    *   Build the Tinder-style discovery card stack.
    *   Implement swipe actions (Like/Dislike) with mutual match detection.
4.  **Real-Time Chat:**
    *   Initialize Socket.IO in `backend/src/features/chat`.

## 6. Critical Rules for Agent
*   **Check Shared:** Always check `@shared` before adding new logic/types.
*   **No Mongoose:** Native Driver ONLY.
*   **Arrow Functions:** Required for all backend functions and frontend components.
*   **Completeness Rule:** Always respect the 80% threshold for matching features.
