# Architecture & Integration Diagrams

Visual representation of current state vs recommended state.

---

## Current State: Problems

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND & FRONTEND TODAY                     │
└─────────────────────────────────────────────────────────────────┘

BACKEND                                FRONTEND
─────────────────────────────────────────────────────────────────

handlers/                              components/
  ├─ rest-api/public/                   ├─ auth/
  │   ├─ login.ts                       │   ├─ LoginForm.tsx
  │   ├─ sign-up.ts                     │   ├─ SignupForm.tsx
  │   └─ forget-password.ts             │   └─ ...
  │
validations/public/                    lib/validations/
  ├─ login.ts                           ├─ auth.ts
  ├─ sign-up.ts                         │
  └─ forget-password.ts                 lib/api/
                                        ├─ auth.ts
services/
  ├─ auth.ts (275 lines)               lib/api-client.ts
  ├─ email.ts
  └─ error.ts


PROBLEM #1: DUPLICATION ❌
─────────────────────────────────────────────────────────────────
Backend: src/validations/public/login.ts
Frontend: src/lib/validations/auth.ts
         → Same schema defined TWICE
         → Changes require updates in BOTH places
         → Bugs from misalignment
         → No single source of truth


PROBLEM #2: NO SHARED TYPES ❌
─────────────────────────────────────────────────────────────────
Backend returns:               Frontend expects:
{ accessToken, name }    ←→    { accessToken, name }
            ↓
   Manually synced
   No type guarantees
   Discover mismatches at runtime


PROBLEM #3: WEAK TYPE SAFETY ❌
─────────────────────────────────────────────────────────────────
Backend: const handler = async (event) => { ... }
                                               ↑ Type inferred
         ESLint rule: WARN (easy to ignore)

Frontend: export async function apiRequest(endpoint) { ... }
                                                       ↑ Type not declared
         ESLint: No rule enforcement


PROBLEM #4: ORGANIZATION ⚠️
─────────────────────────────────────────────────────────────────
Backend: Mixed structure
  - handlers in one place
  - services in another
  - validations in another
  → Hard to find auth-related code
  → Hard to test together

Frontend: Same issue
  - components scattered
  - api calls separate
  - validations separate
  → Hard to find auth-related code
  → Hard to understand flow
```

---

## Recommended State: Solution

```
┌─────────────────────────────────────────────────────────────────┐
│               AFTER STANDARDIZATION (Recommended)               │
└─────────────────────────────────────────────────────────────────┘

ROOT
├── shared-types/          ← SINGLE SOURCE OF TRUTH
│   ├── types/
│   │   ├── errors.types.ts
│   │   ├── auth.types.ts     ← LoginResponse, UserProfile, etc
│   │   ├── common.types.ts
│   │   └── index.ts
│   ├── validations/
│   │   ├── auth.validation.ts ← loginValidation, signupValidation
│   │   └── index.ts
│   └── package.json
│
├── backend/
│   └── src/
│       ├── features/auth/        ← FEATURE-BASED
│       │   ├── auth.handler.ts   ← HTTP entry points
│       │   ├── auth.service.ts   ← Business logic
│       │   ├── token.service.ts  ← JWT management
│       │   ├── email.service.ts  ← Email sending
│       │   ├── auth.types.ts     ← Auth-specific types
│       │   ├── auth.validation.ts← Re-exports shared
│       │   └── index.ts
│       ├── shared/               ← Shared utilities
│       │   ├── middleware/
│       │   ├── errors/
│       │   ├── db/
│       │   └── types/
│       └── index.ts
│
└── frontend/
    └── src/
        ├── features/auth/        ← FEATURE-BASED
        │   ├── components/
        │   │   ├── LoginForm.tsx
        │   │   ├── SignupForm.tsx
        │   │   └── ...
        │   ├── hooks/
        │   │   ├── useAuth.ts
        │   │   └── useLogin.ts
        │   ├── services/
        │   │   └── auth.service.ts
        │   ├── types/
        │   │   └── auth.types.ts ← Import from shared-types
        │   ├── validations/
        │   │   └── auth.validation.ts ← Import from shared-types
        │   └── index.ts
        ├── shared/               ← Shared components & utils
        │   ├── api/
        │   │   └── client.ts
        │   ├── components/
        │   ├── types/
        │   └── hooks/
        └── app/


BENEFIT #1: SINGLE SOURCE OF TRUTH ✅
─────────────────────────────────────────────────────────────────
shared-types/validations/auth.validation.ts
         ↓              ↓
    BACKEND         FRONTEND
  imports and     imports and
   uses for       uses for
  validation      validation
    → Changes once, used everywhere
    → Type guarantees


BENEFIT #2: SHARED TYPES ✅
─────────────────────────────────────────────────────────────────
Backend exports:         Frontend imports:
type LoginResponse {  ←→ type LoginResponse {
  accessToken          accessToken
  expiresIn            expiresIn
  user: UserProfile    user: UserProfile
}                    }
    → Both use same types
    → Misalignment impossible
    → Type-safe guarantees


BENEFIT #3: STRICT TYPE SAFETY ✅
─────────────────────────────────────────────────────────────────
Backend:
const loginHandler = async (event): Promise<LoginResponse> => {
                                     ↑ Type explicit
}
ESLint rule: ERROR (must fix)

Frontend:
export const LoginForm: React.FC = () => {
                       ↑ Type explicit
}
ESLint rule: ERROR (must fix)

    → All functions have explicit return types
    → Compiler verifies types match
    → Refactoring is safe


BENEFIT #4: CLEAR ORGANIZATION ✅
─────────────────────────────────────────────────────────────────
Everything auth is in:

Backend:   backend/src/features/auth/  ← All auth code here
Frontend:  frontend/src/features/auth/ ← All auth code here

    → Easy to find code
    → Easy to test
    → Easy to understand flow
    → Easy to delete feature
    → Ready to add new features (payments, messages, etc)
```

---

## Data Flow: Before vs After

### BEFORE: Login Flow (Broken)

```
┌──────────────────────────────────────────────────────────────────┐
│                  Frontend Submit Login Form                      │
└──────────────────────────────────────────────────────────────────┘
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Validate with: src/lib/validations/auth.ts                 │
   │ loginSchema = z.object({                                    │
   │   email: emailSchema,                                       │
   │   password: passwordSchema,                                 │
   │ })                                                          │
   └─────────────────────────────────────────────────────────────┘
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Call API: src/lib/api/auth.ts → apiRequest                 │
   └─────────────────────────────────────────────────────────────┘
                            ↓
                    ↓ NETWORK ↓
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Backend receives request                                     │
   │ Route: handlers/rest-api/public/login.ts                    │
   └─────────────────────────────────────────────────────────────┘
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Validate with: src/validations/public/login.ts             │
   │ validationSchema = z.object({                               │
   │   email: emailSchema,  ← DIFFERENT DEFINITION!             │
   │   password: passwordSchema,                                 │
   │ })                                                          │
   │ ⚠️  PROBLEM: If frontend changes email format,             │
   │     this might not match!                                    │
   └─────────────────────────────────────────────────────────────┘
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Call service: services/auth.ts → authenticateUser           │
   └─────────────────────────────────────────────────────────────┘
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Return response:                                             │
   │ {                                                            │
   │   accessToken: string,                                       │
   │   name: string                                               │
   │ }                                                            │
   │ ⚠️  PROBLEM: Frontend expects this shape, but if we         │
   │     add a field, nobody knows to update frontend types      │
   └─────────────────────────────────────────────────────────────┘
                            ↓
                    ↓ NETWORK ↓
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Frontend receives response                                   │
   │ Types: src/types/auth.ts                                    │
   │ interface LoginResponse {                                    │
   │   accessToken: string,                                       │
   │   name: string                                               │
   │ }                                                            │
   │ ⚠️  PROBLEM: If backend changes response shape,            │
   │     frontend types might not match!                          │
   └─────────────────────────────────────────────────────────────┘
                            ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Update state, redirect to /main                             │
   └─────────────────────────────────────────────────────────────┘


RESULT: Works today, but fragile
  ❌ Frontend and backend validation could diverge
  ❌ Response shape could change undetected
  ❌ Hard to refactor
  ❌ Bugs hard to trace
```

### AFTER: Login Flow (Solid)

```
┌──────────────────────────────────────────────────────────────────┐
│  shared-types/validations/auth.validation.ts (SINGLE SOURCE)    │
│  export const loginValidation = z.object({                       │
│    email: emailSchema,                                           │
│    password: passwordSchema,                                     │
│  })                                                              │
└──────────────────────────────────────────────────────────────────┘
         ↓                               ↓
    BACKEND              ↔ FRONTEND IMPORTS SAME SCHEMA
    imports                 validates with
    for validation          loginValidation


┌──────────────────────────────────────────────────────────────────┐
│  shared-types/types/auth.types.ts (SINGLE SOURCE)               │
│  export interface LoginResponse {                                │
│    accessToken: string                                           │
│    expiresIn: number                                             │
│    tokenType: 'Bearer'                                           │
│    user: UserProfile                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
         ↓                               ↓
    BACKEND              ↔ FRONTEND IMPORTS SAME TYPE
    returns                 expects
    LoginResponse           LoginResponse


FLOW:

Frontend: Submit Login Form
    ↓
[Validate with loginValidation from shared-types] ✅
    ↓
Call API
    ↓
Backend: Receive Request
    ↓
[Validate with loginValidation from shared-types] ✅ (SAME!)
    ↓
Service: authenticateUser
    ↓
Return LoginResponse (from shared-types)
    ↓
Frontend: Receive Response
    ↓
[Check type: LoginResponse from shared-types] ✅ (SAME!)
    ↓
Update state, redirect

RESULT: Type-safe end-to-end
  ✅ Both validate with same schema
  ✅ Both use same response type
  ✅ If anyone changes schema, error caught immediately
  ✅ No manual syncing needed
  ✅ Easy to refactor
  ✅ Bugs caught early
```

---

## File Organization Comparison

### BEFORE: Where Is Auth Code?

```
Q: Where is the login validation?
A: backend/src/validations/public/login.ts
   frontend/src/lib/validations/auth.ts
   (Both places! How confusing!)

Q: Where is the login handler?
A: backend/src/handlers/rest-api/public/login.ts

Q: Where is the login form?
A: frontend/src/components/auth/LoginForm.tsx

Q: Where is the login API call?
A: frontend/src/lib/api/auth.ts

Q: Where is the login logic?
A: backend/src/services/auth.ts (also has token + password logic)

Q: Where is token management?
A: Inside services/auth.ts (mixed with auth logic)

Q: Where is email sending?
A: Inside services/auth.ts (mixed with everything)

RESULT: Auth code scattered across 8+ locations
  ❌ Hard to find
  ❌ Hard to test
  ❌ Hard to understand
  ❌ Hard to maintain
```

### AFTER: Where Is Auth Code?

```
Q: Where is the login validation?
A: shared-types/validations/auth.validation.ts (ONE place!)

Q: Where is the login handler?
A: backend/src/features/auth/auth.handler.ts

Q: Where is the login form?
A: frontend/src/features/auth/components/LoginForm.tsx

Q: Where is the login API call?
A: frontend/src/features/auth/services/auth.service.ts

Q: Where is the login logic?
A: backend/src/features/auth/auth.service.ts

Q: Where is token management?
A: backend/src/features/auth/token.service.ts (separated)

Q: Where is email sending?
A: backend/src/features/auth/email.service.ts (separated)

Q: Where are auth types?
A: shared-types/types/auth.types.ts (ONE place!)

RESULT: Auth code in ONE folder per service
  ✅ Easy to find
  ✅ Easy to test
  ✅ Easy to understand
  ✅ Easy to maintain
  ✅ Clear feature boundary
```

---

## Dependency Graph: Before vs After

### BEFORE: Tangled Dependencies

```
frontend/components/auth/LoginForm.tsx
    ↓
frontend/lib/validations/auth.ts (own copy of schema)
    ↓
frontend/lib/api/auth.ts
    ↓
HTTP
    ↓
backend/handlers/rest-api/public/login.ts
    ↓
backend/validations/public/login.ts (different copy of schema!)
    ↓
backend/services/auth.ts (275 lines with everything)
    ├─ Token logic
    ├─ Password hashing
    ├─ Email sending
    └─ User creation

DATABASE

RESULT: Two validation copies exist independently
  ❌ Can diverge
  ❌ Sync errors likely
  ❌ 275-line auth service is unmaintainable
```

### AFTER: Clean Dependencies

```
shared-types/validations/auth.validation.ts ← SINGLE SOURCE
    ↓                    ↓
    ├─→ frontend imports  └─→ backend imports
        (LoginForm uses)       (handler uses)

shared-types/types/auth.types.ts ← SINGLE SOURCE
    ↓                    ↓
    ├─→ frontend imports  └─→ backend imports
        (types)              (returns)

frontend/features/auth/
├─ components/LoginForm.tsx
├─ services/auth.service.ts
├─ hooks/useAuth.ts
└─ validations/auth.validation.ts (re-exports from shared)

backend/features/auth/
├─ auth.handler.ts (HTTP entry)
├─ auth.service.ts (auth logic only)
├─ token.service.ts (JWT only)
├─ email.service.ts (email only)
└─ auth.validation.ts (re-exports from shared)

DATABASE

RESULT: Single source of truth for schema and types
  ✅ One validation definition
  ✅ One type definition
  ✅ Changes in one place
  ✅ Services separated by concern
  ✅ No duplication
```

---

## Import Pattern Changes

### BEFORE

```typescript
// backend/handlers/rest-api/public/login.ts
import { validationSchema } from '@/validations/public/login'
import { authService } from '@/services/auth'

// frontend/components/auth/LoginForm.tsx
import { loginSchema, type LoginFormData } from '@/src/lib/validations/auth'
import { login } from '@/src/lib/api/auth'

// Two different import patterns
// Two different schema locations
// No type sharing
```

### AFTER

```typescript
// backend/features/auth/auth.handler.ts
import { loginValidation } from '@shared-types/validations'
import { authService } from './auth.service'
import type { LoginResponse } from '@shared-types/types'

// frontend/features/auth/components/LoginForm.tsx
import { loginValidation, type LoginValidationType } from '@shared-types/validations'
import { authService } from '../services/auth.service'
import type { LoginResponse } from '@shared-types/types'

// Same import patterns
// Same schema location
// Same types location
// Both can rely on each other
```

---

## Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    STANDARDIZATION JOURNEY                      │
└─────────────────────────────────────────────────────────────────┘

    CURRENT STATE                   RECOMMENDED STATE
    ─────────────                   ─────────────────

    ❌ Duplicated schemas      →    ✅ Single shared-types
    ❌ Type misalignment       →    ✅ Shared types everywhere
    ❌ Weak linting            →    ✅ Strict ESLint enforcement
    ❌ Scattered auth code     →    ✅ Feature-based organization
    ❌ Mixed concerns          →    ✅ Single responsibility
    ❌ Hard to maintain        →    ✅ Easy to maintain & scale

    Cost: ~16-24 hours work
    Benefit: Infinite (long-term maintainability)
```

---

This should help visualize what's happening and why the changes matter!
