# Full-Stack Monorepo Security & Consistency Audit Report

**Generated:** January 6, 2026  
**Scope:** Data Integrity, Code Consistency, and Deployment Safety

---

## Executive Summary

This audit identified **15 issues** across the monorepo:

- **Critical:** 3 issues (data integrity, security)
- **High:** 5 issues (type mismatches, code consistency)
- **Medium:** 4 issues (logging, configuration)
- **Low:** 3 issues (code style, minor inconsistencies)

---

## 1. Data Integrity & Consistency Audit (Backend & Shared)

### 1.1 Critical: Type Mismatch in DbMatch Schema

**File Path:** `backend/src/data/db/types/match.ts`

**Issue:** The `DbMatch` type declares `users` as `string[]`, but the `match.service.ts` stores `ObjectId[]` values. This type mismatch can cause runtime errors and data corruption.

```typescript
// Current (incorrect)
export type DbMatch = BaseCollection & {
  users: string[] // Declared as string[]
  createdAt: Date
  updatedAt: Date
}
```

**Evidence in match.service.ts (lines 165-169):**

```typescript
const match: DbMatch = {
  users: sortedUserIds, // sortedUserIds is ObjectId[]
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**Recommendation:** Update the type to use `ObjectId[]`:

```typescript
import { ObjectId, WithId } from 'mongodb'
import { BaseCollection } from '@shared/types'

export type Match = WithId<DbMatch>
export type DbMatch = BaseCollection & {
  users: ObjectId[] // Corrected to ObjectId[]
  createdAt: Date
  updatedAt: Date
}
```

---

### 1.2 High: Potential Race Condition in User Creation

**File Path:** `backend/src/features/auth/services/auth.service.ts`

**Issue:** The `createUser` method performs a check-then-insert operation which is not atomic. Under high concurrency, two requests with the same email could pass the existence check simultaneously, leading to duplicate user creation (only caught by MongoDB duplicate key error).

```typescript
// Lines 117-121: Non-atomic check-then-insert
const existingUser = await userCollection.findOne({ 'auth.email': email })
if (existingUser) {
  throw new ServiceException('err.user.already_exists', ErrorCode.BAD_REQUEST)
}
// ... user is inserted later
```

**Recommendation:** Use MongoDB's `findOneAndUpdate` with `upsert: false` or wrap the operation in a transaction, and ensure a unique index exists:

```typescript
// Option 1: Ensure unique index exists (run once during DB setup)
await userCollection.createIndex({ 'auth.email': 1 }, { unique: true })

// Option 2: Use atomic operation with transaction
import { withMongoTransaction } from '@/data/db'

createUser: async input => {
  return await withMongoTransaction(async session => {
    const userCollection = await getUserCollection()

    const existingUser = await userCollection.findOne({ 'auth.email': input.email }, { session })

    if (existingUser) {
      throw new ServiceException('err.user.already_exists', ErrorCode.BAD_REQUEST)
    }

    // ... rest of creation logic with { session } option
  })
}
```

---

### 1.3 High: Sensitive Data Logged in Profile Service

**File Path:** `backend/src/features/profile/services/profile.service.ts`

**Issue:** The service contains multiple `console.log` statements that output user data including `userId`, profile completion status, and full profile data. This could expose sensitive information in production logs.

```typescript
// Line 45: Logs user ID
console.log('service connected', { userId })

// Line 55: Logs profile completion status
console.log({ isComplete })

// Line 71: Logs full profile data
console.log({ profileData })
```

**Recommendation:** Remove debug logging or use a proper logging library with log levels:

```typescript
// Option 1: Remove debug logs entirely (recommended for production)
// Delete lines 45, 55, and 71

// Option 2: Use environment-aware logging
import { logger } from '@/utils/logger'

// Only in development
if (process.env.NODE_ENV === 'development') {
  logger.debug('getProfile called', { userId })
}
```

---

### 1.4 Medium: Decoded JWT Token Logged in Frontend

**File Path:** `frontend/src/features/auth/context/UserContext.tsx`

**Issue:** The decoded JWT token payload (containing user email, name, and IDs) is logged to the browser console, which could expose sensitive user information.

```typescript
// Line 53: Logs decoded token
console.log({ decoded })
```

**Recommendation:** Remove the console.log statement:

```typescript
// Remove this line entirely
// console.log({ decoded });
```

---

### 1.5 Low: Email Service Logs Recipient Information

**File Path:** `backend/src/features/auth/services/email.service.ts`

**Issue:** The email service logs recipient email addresses and subjects, which could be considered PII exposure in production logs.

```typescript
// Line 36
console.info(`Email sent to ${to} with subject "${subject}"`)
```

**Recommendation:** Sanitize or redact email addresses in production:

```typescript
const sanitizedEmail = `${to.substring(0, 3)}***@${to.split('@')[1]}`
console.info(`Email sent to ${sanitizedEmail}`)
```

---

## 2. Codebase Consistency Audit (Frontend, Backend & Shared)

### 2.1 Critical: Type Mismatch Between LoginResponse Definition and Backend Response

**File Path (Type Definition):** `shared/types/auth.ts`  
**File Path (Backend Handler):** `backend/src/features/auth/handlers/login.ts`

**Issue:** The shared `LoginResponse` type expects a `user` object with detailed properties, but the backend handler returns only `accessToken` and `name`.

**Shared Type (shared/types/auth.ts lines 35-44):**

```typescript
export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
  }
}
```

**Actual Backend Response (backend/src/features/auth/handlers/login.ts lines 24-27):**

```typescript
return {
  accessToken,
  name // Only returns name, not user object
}
```

**Recommendation:** Update either the type definition or the backend response to match:

```typescript
// Option 1: Update backend to match type (recommended)
return {
  accessToken,
  user: {
    id: user._id.toHexString(),
    email: user.auth.email,
    firstName: user.auth.firstName,
    lastName: user.auth.lastName,
    name: `${user.auth.lastName} ${user.auth.firstName}`
  }
}

// Option 2: Update shared type to match current behavior
export interface LoginResponse {
  accessToken: string
  name: string
}
```

---

### 2.2 High: Locally Re-declared AuthTokenPayload Type

**File Path:** `frontend/src/features/auth/context/UserContext.tsx`

**Issue:** The `AuthTokenPayload` interface is defined locally instead of importing from `@shared/types`. The local definition also has a different structure (includes `data` object with nested properties).

**Local Definition (lines 13-25):**

```typescript
interface AuthTokenPayload {
  sub: string
  iss: string
  aud: string | string[]
  iat: number
  exp: number
  data: {
    userId: string
    firstName: string
    lastName: string
    email: string
  }
}
```

**Shared Definition (shared/types/auth.ts):**

```typescript
export interface AuthTokenPayload {
  id: string
  email: string
  iat: number
  exp: number
}
```

**Recommendation:** Create a comprehensive `AuthTokenPayload` type in shared and use it consistently:

```typescript
// Update shared/types/auth.ts
export interface AuthTokenPayload {
  sub: string
  iss: string
  aud: string | string[]
  iat: number
  exp: number
  data: {
    userId: string
    firstName: string
    lastName: string
    email: string
  }
}

// Update frontend/src/features/auth/context/UserContext.tsx
import { AuthTokenPayload } from '@shared/types'
// Remove local interface definition
```

---

### 2.3 High: Locally Defined GoogleLoginRequest Type

**File Path:** `frontend/src/features/auth/api/auth.ts`

**Issue:** `GoogleLoginRequest` interface is defined locally instead of being placed in the shared types directory.

```typescript
// Lines 46-48: Local definition
export interface GoogleLoginRequest {
  token: string
}
```

**Recommendation:** Move to shared types and import:

```typescript
// Add to shared/types/auth.ts
export interface GoogleLoginRequest {
  token: string
}

// Update shared/types/index.ts
export type {
  // ... existing exports
  GoogleLoginRequest
} from './auth'

// Update frontend/src/features/auth/api/auth.ts
import { GoogleLoginRequest } from '@shared/types'
// Remove local interface definition
```

---

### 2.4 High: Return Type Mismatch in getMatches API Function

**File Path:** `frontend/src/features/swipe/api/swipe.ts`

**Issue:** The `getMatches` function declares return type as `Match[]`, but the backend's `matchService.getMatches` returns `MatchWithUser[]`.

```typescript
// Frontend (line 18)
export const getMatches = async (userId: string): Promise<Match[]> => {
  return apiRequest<Match[]>(`/matches/${userId}`, {
    method: 'GET'
  })
}
```

**Backend return type (match.service.ts line 184):**

```typescript
getMatches: async (userId: string): Promise<MatchWithUser[]> => {
```

**Recommendation:** Update frontend to use correct type:

```typescript
import { User, SwipeRequest, SwipeResponse, MatchWithUser } from '@shared/types'

export const getMatches = async (userId: string): Promise<MatchWithUser[]> => {
  return apiRequest<MatchWithUser[]>(`/matches/${userId}`, {
    method: 'GET'
  })
}
```

---

### 2.5 Medium: Inconsistent Import Paths for Shared Validations in Backend

**File Path:** Multiple backend files

**Issue:** Backend files inconsistently import from `@shared/validations` vs `@/shared-types/validations`, causing confusion and potential issues if paths change.

**Examples:**

- `backend/src/features/auth/handlers/sign-up.ts`: Uses `@shared/validations`
- `backend/src/features/matches/handlers/list-candidates.ts`: Uses `@/shared-types/validations`
- `backend/src/features/profile/handlers/get-profile.ts`: Uses `@/shared-types/validations`

**Recommendation:** Standardize all imports to use one path alias consistently:

```typescript
// Standardize to @shared/validations across all files
import { signupSchema, objectIdSchema, profileUpdateSchema } from '@shared/validations'
```

Update `backend/tsconfig.json` paths if needed:

```json
{
  "paths": {
    "@/*": ["*"],
    "@shared/*": ["shared-types/*"]
  }
}
```

---

### 2.6 Medium: Import Path Inconsistency for Base Collection Type

**File Path:** `backend/src/data/db/types/match.ts`

**Issue:** Imports `BaseCollection` from `@/shared-types/types` instead of `@shared/types`, unlike other files.

```typescript
// Current
import { BaseCollection } from '@/shared-types/types'

// Other files use
import { BaseCollection } from '@shared/types'
```

**Recommendation:** Standardize the import:

```typescript
import { BaseCollection } from '@shared/types'
```

---

## 3. Vercel Deployment Safety Audit (Root, Frontend & Backend)

### 3.1 Medium: Multiple Conflicting vercel.json Files

**File Paths:**

- `vercel.json` (root)
- `frontend/vercel.json`
- `backend/vercel.json`

**Issue:** The presence of multiple `vercel.json` files can cause deployment confusion. The root configuration is designed for monorepo deployment, but the separate configs may interfere if someone deploys from subdirectories.

**Root vercel.json configuration:**

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run copy:shared && npm run build",
  "installCommand": "cd shared && npm install && cd ../frontend && npm install && cd ../backend && npm install",
  "framework": "nextjs",
  "outputDirectory": "frontend/.next",
  "rewrites": [
    {
      "source": "/v1/:path*",
      "destination": "/api/v1/:path*"
    }
  ]
}
```

**Recommendation:** Remove or rename the subdirectory vercel.json files to prevent accidental misuse:

```bash
# Rename to prevent accidental use
mv frontend/vercel.json frontend/vercel.json.standalone
mv backend/vercel.json backend/vercel.json.standalone
```

Or add comments/documentation clarifying which config to use:

```json
// In frontend/vercel.json - add to README
// Note: This config is for standalone deployment only.
// For monorepo deployment, use the root vercel.json
```

---

### 3.2 Low: Backend vercel.json Missing Output Directory

**File Path:** `backend/vercel.json`

**Issue:** The backend's `vercel.json` doesn't specify an `outputDirectory`, which could cause deployment issues if used standalone.

```json
{
  "version": 2,
  "buildCommand": "npm run copy:shared",
  "installCommand": "npm install && cd ../shared && npm install",
  "framework": null
  // Missing: "outputDirectory"
}
```

**Recommendation:** If keeping this config for standalone backend deployment, add the output directory:

```json
{
  "version": 2,
  "buildCommand": "npm run copy:shared && npm run build",
  "installCommand": "npm install && cd ../shared && npm install",
  "framework": null,
  "outputDirectory": "lib"
}
```

---

### 3.3 Low: Environment Variable Documentation Accuracy

**File Path:** `ENVIRONMENT_VARIABLES.md`

**Issue:** Documentation references `JWT_REFRESH_SECRET` which doesn't appear to be used in the codebase (only `JWT_SECRET` is used).

**Recommendation:** Remove unused environment variable from documentation or implement refresh token functionality if intended:

```markdown
# Remove from documentation if not used:

- JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
```

---

### 3.4 Positive: Environment Variable Security ✓

**Status:** PASSED

The environment variable configuration correctly:

- Uses `NEXT_PUBLIC_` prefix only for frontend-safe variables
- Keeps sensitive variables (JWT_SECRET, MONGO_URL, EMAIL_PASS) server-side only
- Documents proper separation between frontend and backend variables

---

## Summary of Required Actions

### Critical Priority (Fix Immediately)

1. Fix `DbMatch.users` type from `string[]` to `ObjectId[]`
2. Align `LoginResponse` type with actual backend response
3. Create atomic user creation to prevent race conditions

### High Priority (Fix Before Next Release)

4. Remove or standardize `AuthTokenPayload` local definition
5. Move `GoogleLoginRequest` to shared types
6. Fix `getMatches` return type to `MatchWithUser[]`
7. Standardize import paths for shared modules

### Medium Priority (Plan for Sprint)

8. Remove debug `console.log` statements from profile service
9. Remove `console.log` from UserContext.tsx
10. Standardize on single vercel.json strategy
11. Standardize import path aliases across backend

### Low Priority (Technical Debt)

12. Sanitize email logging in email service
13. Add outputDirectory to backend vercel.json
14. Clean up environment variable documentation
15. Review and remove any unused console statements across codebase

---

## Appendix: Files Requiring Changes

| File                                                       | Priority | Issue Type            |
| ---------------------------------------------------------- | -------- | --------------------- |
| `backend/src/data/db/types/match.ts`                       | Critical | Type Mismatch         |
| `shared/types/auth.ts`                                     | Critical | Type Mismatch         |
| `backend/src/features/auth/handlers/login.ts`              | Critical | Response Mismatch     |
| `backend/src/features/auth/services/auth.service.ts`       | High     | Race Condition        |
| `frontend/src/features/auth/context/UserContext.tsx`       | High     | Local Type Definition |
| `frontend/src/features/auth/api/auth.ts`                   | High     | Local Type Definition |
| `frontend/src/features/swipe/api/swipe.ts`                 | High     | Return Type Mismatch  |
| `backend/src/features/matches/handlers/list-candidates.ts` | Medium   | Import Path           |
| `backend/src/features/profile/handlers/get-profile.ts`     | Medium   | Import Path           |
| `backend/src/features/profile/services/profile.service.ts` | Medium   | Debug Logging         |
| `frontend/vercel.json`                                     | Medium   | Config Redundancy     |
| `backend/vercel.json`                                      | Low      | Missing Config        |
| `ENVIRONMENT_VARIABLES.md`                                 | Low      | Documentation         |
| `backend/src/features/auth/services/email.service.ts`      | Low      | PII Logging           |

---

_End of Audit Report_
