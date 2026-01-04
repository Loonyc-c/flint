# Quick Implementation Checklist

Use this to track progress on standardization work.

## Phase 1: Foundation Setup (Week 1 - Day 1-2)

### Shared Types Creation

- [ ] Create `/shared-types/` folder in root
- [ ] Create `/shared-types/types/errors.types.ts`
  - [ ] Define `ApiErrorCode` enum
  - [ ] Define `ApiErrorResponse` interface
  - [ ] Define `ApiException` class
- [ ] Create `/shared-types/types/auth.types.ts`
  - [ ] Define all request/response types
  - [ ] Define `UserProfile` interface
  - [ ] Define `AuthToken` interface
- [ ] Create `/shared-types/types/common.types.ts`
  - [ ] Define pagination types
  - [ ] Define localization types
- [ ] Create `/shared-types/types/index.ts` (re-exports)
- [ ] Create `/shared-types/validations/auth.validation.ts`
  - [ ] Extract all Zod schemas
  - [ ] Keep single definition
- [ ] Create `/shared-types/validations/index.ts`
- [ ] Create `/shared-types/package.json`

**Validation**: Both frontend and backend can import from shared-types

---

## Phase 2: Backend Refactoring (Week 1 - Day 2-3)

### Create Feature Structure

- [ ] Create `backend/src/features/` directory
- [ ] Create `backend/src/features/auth/` with:
  - [ ] `auth.types.ts` (extends shared types)
  - [ ] `auth.validation.ts` (imports from shared-types)
  - [ ] `token.service.ts` (token logic split out)
  - [ ] `auth.service.ts` (refactored, shorter)
  - [ ] `auth.handler.ts` (HTTP entry points)
  - [ ] `email.service.ts` (email logic split out)
  - [ ] `index.ts` (exports)

### Update Backend Imports

- [ ] Update `backend/tsconfig.json` paths:
  - [ ] Add `@shared-types/*` path
  - [ ] Verify `@/*` points to `src/*`
- [ ] Update `backend/package.json`:
  - [ ] Add `@shared-types` dependency
  - [ ] Add type-check script
- [ ] Update all route files to use new feature structure
- [ ] Update middleware to use new auth service

### Clean Up

- [ ] Delete or archive `backend/src/models/user.model.js`
- [ ] Delete old `backend/src/handlers/rest-api/public/` folder
- [ ] Delete old `backend/src/services/auth.ts`
- [ ] Delete old `backend/src/validations/` folder
- [ ] Update `backend/src/routes/` to import from `features/auth`

### Testing

- [ ] `npm run lint` passes with no errors
- [ ] `npm run type-check` passes
- [ ] `npm run dev` starts without errors
- [ ] Test login endpoint: `POST /auth/login`
- [ ] Test signup endpoint: `POST /auth/sign-up`
- [ ] Test forget password: `POST /auth/forget-password`
- [ ] Test reset password: `PATCH /auth/reset-password/:token`

**Validation**: All auth endpoints work, no type errors

---

## Phase 3: Frontend Refactoring (Week 1 - Day 3-4)

### Create Feature Structure

- [ ] Create `frontend/src/features/` directory
- [ ] Create `frontend/src/features/auth/` with:
  - [ ] `components/` folder:
    - [ ] Move `LoginForm.tsx` from `components/auth/`
    - [ ] Move `SignupForm.tsx`
    - [ ] Move `ForgetPasswordForm.tsx`
    - [ ] Move `ResetPasswordForm.tsx`
  - [ ] `hooks/` folder:
    - [ ] Create `useAuth.ts` (auth state management)
    - [ ] Create `useLogin.ts` (login logic)
  - [ ] `services/` folder:
    - [ ] Create `auth.service.ts` (API calls)
  - [ ] `types/` folder:
    - [ ] Create `auth.types.ts` (imports from shared-types)
  - [ ] `validations/` folder:
    - [ ] Create `auth.validation.ts` (imports from shared-types)
  - [ ] `index.ts` (exports)

### Create Shared Frontend Structure

- [ ] Create `frontend/src/shared/` directory with:
  - [ ] `api/` folder:
    - [ ] Update `client.ts` (add return type annotations)
    - [ ] Create `endpoints.ts` (API endpoints enum)
    - [ ] Create `interceptors.ts` (if needed)
  - [ ] `components/` folder:
    - [ ] Move shadcn UI components
  - [ ] `types/` folder:
    - [ ] Create `api.types.ts` (general API types)
    - [ ] Create `errors.types.ts` (import from shared-types)
  - [ ] `hooks/` folder:
    - [ ] Create `useApi.ts` (generic API hook)
  - [ ] `context/` folder:
    - [ ] Create `AuthContext.ts`
    - [ ] Create `providers.tsx`
  - [ ] `utils/` folder:
  - [ ] `constants/` folder:

### Update Frontend Imports

- [ ] Update `frontend/tsconfig.json` paths:
  - [ ] Add `@shared-types/*` path
  - [ ] Add `@/shared/*` path
  - [ ] Add `@/features/*` path
- [ ] Update `frontend/package.json`:
  - [ ] Add `@shared-types` dependency
  - [ ] Add lint:fix script
- [ ] Update all component imports to use new structure

### Update Component Files

- [ ] `LoginForm.tsx`:
  - [ ] Import from `validations/auth.validation.ts`
  - [ ] Import from `services/auth.service.ts`
  - [ ] Import from `hooks/useAuth.ts`
  - [ ] Add return type to component
  - [ ] Use `LoginValidationType` from shared
- [ ] `SignupForm.tsx`: (same updates)
- [ ] `ForgetPasswordForm.tsx`: (same updates)
- [ ] `ResetPasswordForm.tsx`: (same updates)

### Clean Up

- [ ] Delete old `frontend/src/components/auth/` folder
- [ ] Delete old `frontend/src/lib/api/auth.ts`
- [ ] Delete old `frontend/src/lib/validations/auth.ts`
- [ ] Delete old `frontend/src/lib/api-client.ts` (update location if keeping)
- [ ] Update `frontend/src/app/auth/page.tsx` to use new components
- [ ] Update all auth page routes to use new structure

### Testing

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] Test login form submission
- [ ] Test form validation (email, password)
- [ ] Test error handling on failed login
- [ ] Test signup form
- [ ] Test forget password flow
- [ ] Test reset password flow

**Validation**: All auth pages work, no type errors, validations sync with backend

---

## Phase 4: ESLint & Type Safety (Week 2 - Day 1)

### Backend ESLint

- [ ] Convert `eslint.config.js` → `eslint.config.ts`
- [ ] Add `tseslint.configs.recommendedTypeChecked`
- [ ] Add return type enforcement rules
- [ ] Add async/promise safety rules
- [ ] Add strict boolean expression rules
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm run type-check` and fix all errors
- [ ] Add CI check for lint/type-check

### Frontend ESLint

- [ ] Create/update `eslint.config.mjs` with same rules
- [ ] Add `@typescript-eslint/recommended-type-checked`
- [ ] Add Next.js plugin config
- [ ] Add return type enforcement
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm run build` and verify no type errors
- [ ] Add pre-commit hook to lint

### Code Fixes Required

- [ ] **Backend**: Add return types to all functions:

  ```typescript
  // Before
  const handler = async (event: NormalizedEvent) => {
    return { ... }
  }

  // After
  const handler = async (event: NormalizedEvent): Promise<LoginResponse> => {
    return { ... }
  }
  ```

- [ ] **Backend**: Add explicit handler return types in all files
- [ ] **Frontend**: Add return types to components and hooks:

  ```typescript
  // Before
  export const LoginForm = () => {
    return <form>...</form>
  }

  // After
  export const LoginForm: React.FC = () => {
    return <form>...</form>
  }
  ```

- [ ] **Frontend**: Add return types to all utility functions
- [ ] Fix any floating promises (add `await` or `void`)
- [ ] Fix any unused variables

**Validation**: Both `npm run lint` and `npm run type-check` pass cleanly

---

## Phase 5: Integration Testing (Week 2 - Day 2)

### API Contract Testing

- [ ] Backend returns `LoginResponse` shape from shared-types
- [ ] Frontend expects same shape in types
- [ ] Validation schemas match between frontend and backend
- [ ] Error codes align (`ApiErrorCode` enum used both sides)
- [ ] Token format is consistent

### End-to-End Flows

- [ ] **Login Flow**:

  - [ ] Frontend form validates with shared schema
  - [ ] Frontend sends LoginRequest to backend
  - [ ] Backend validates with shared schema
  - [ ] Backend returns LoginResponse with token and user
  - [ ] Frontend stores token and user in localStorage
  - [ ] Frontend redirects to /main

- [ ] **Signup Flow**:

  - [ ] Frontend form validates with shared schema
  - [ ] Backend creates user in MongoDB
  - [ ] Backend sends verification email
  - [ ] Frontend shows success message

- [ ] **Forget Password Flow**:

  - [ ] Frontend validates email with shared schema
  - [ ] Backend generates reset token
  - [ ] Backend sends email with reset link
  - [ ] Frontend shows confirmation message

- [ ] **Reset Password Flow**:
  - [ ] Frontend validates passwords with shared schema
  - [ ] Backend verifies reset token
  - [ ] Backend updates password
  - [ ] Frontend redirects to login

### Error Handling

- [ ] Invalid email format caught on both sides
- [ ] Weak password rejected on both sides
- [ ] Duplicate email handled with proper error code
- [ ] Invalid token returns correct error
- [ ] Server errors displayed with proper messages

**Validation**: All auth flows work end-to-end without issues

---

## Phase 6: Documentation (Week 2 - Day 3)

### API Documentation

- [ ] Document all auth endpoints in `ARCHITECTURE.md`:
  - [ ] POST `/auth/login`
  - [ ] POST `/auth/sign-up`
  - [ ] POST `/auth/forget-password`
  - [ ] PATCH `/auth/reset-password/:token`
- [ ] Include request/response examples
- [ ] Document error codes
- [ ] Document token format and storage

### Type Documentation

- [ ] Create `TYPES.md` documenting:
  - [ ] User types
  - [ ] Auth types
  - [ ] Error types
  - [ ] How to add new types
- [ ] Document shared-types structure
- [ ] Document when to add types to shared vs local

### Folder Structure Documentation

- [ ] Create `FOLDER_STRUCTURE.md` with:
  - [ ] Directory tree
  - [ ] Purpose of each folder
  - [ ] Where to add new features
  - [ ] Import patterns

### Developer Guide

- [ ] Update `README.md` with:
  - [ ] Setup instructions
  - [ ] Development flow
  - [ ] Common tasks
  - [ ] Troubleshooting

**Validation**: Documentation is clear and complete

---

## Phase 7: Final Polish (Week 2 - Day 4)

### Security Review

- [ ] Verify CORS configuration
- [ ] Check rate limiting on auth endpoints
- [ ] Verify password hashing
- [ ] Check token expiration
- [ ] Verify email verification flow

### Performance

- [ ] Check API response times
- [ ] Check bundle size impact
- [ ] Verify no console.logs in production code
- [ ] Check for memory leaks in components

### Code Quality

- [ ] No TODO comments without tracking
- [ ] All error cases handled
- [ ] All types exported properly
- [ ] No `any` types remaining

### Testing Coverage (if using tests)

- [ ] Unit tests for services
- [ ] Integration tests for API calls
- [ ] Component tests for forms

---

## Quick Command Reference

```bash
# Backend
cd backend
npm install                    # Install dependencies
npm run lint                   # Run ESLint
npm run lint:fix              # Fix ESLint errors
npm run type-check            # Check TypeScript
npm run dev                   # Start dev server

# Frontend
cd frontend
npm install
npm run lint
npm run lint:fix
npm run build                 # Build and type-check
npm run dev

# Shared Types
cd shared-types
npm install
# No build needed, just TypeScript types
```

---

## Success Criteria Checklist

- [ ] All auth functionality works end-to-end
- [ ] `npm run lint` passes on both frontend and backend
- [ ] `npm run type-check` passes (backend)
- [ ] `npm run build` succeeds (frontend)
- [ ] No duplicate validation schemas
- [ ] No duplicate type definitions
- [ ] All functions have return type annotations
- [ ] Frontend and backend use shared-types
- [ ] Error handling is consistent
- [ ] Documentation is complete
- [ ] All imports follow new structure
- [ ] No merge conflicts in code
- [ ] Code review approved

---

## Notes

- **Estimated Time**: 1-2 weeks depending on code size
- **Team Size Impact**: If multiple developers, communicate structure changes
- **Testing**: Test each phase before moving to next
- **Backups**: Commit to git before each phase
- **Rollback Plan**: Keep old code commented for reference initially

---

## Getting Help

If stuck:

1. Check STANDARDIZATION_ANALYSIS.md for detailed explanations
2. Check IMPLEMENTATION_GUIDE.md for code examples
3. Look at existing code patterns before creating new code
4. Ask team members about conventions
5. Check git history for how patterns evolved

---

**Last Updated**: January 4, 2026  
**Status**: Ready for Implementation  
**Phase**: Foundation Setup (Week 1)
