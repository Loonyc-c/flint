# Quick Start: First Steps Tomorrow

**Don't try to do everything at once. Start here.**

---

## Day 1: Morning (30 minutes)

### Read Documentation

- [ ] Read `STANDARDIZATION_ANALYSIS.md` (10 min) - understand the problems
- [ ] Read this guide (5 min)
- [ ] Read `ESLINT_GUIDE.md` linting section (15 min)

### Decision Point

- [ ] Do you agree with recommendations?
- [ ] Do you have a different approach?
- [ ] Any blockers?

---

## Day 1: Afternoon (2-3 hours)

### Create Shared Types Foundation

```bash
# In project root
mkdir -p shared-types/types
mkdir -p shared-types/validations
touch shared-types/package.json
touch shared-types/types/index.ts
touch shared-types/types/errors.types.ts
touch shared-types/types/auth.types.ts
touch shared-types/validations/index.ts
touch shared-types/validations/auth.validation.ts
```

### Copy Code Templates

Use the code from `IMPLEMENTATION_GUIDE.md`:

1. Copy error types into `shared-types/types/errors.types.ts`
2. Copy auth types into `shared-types/types/auth.types.ts`
3. Copy validation schemas into `shared-types/validations/auth.validation.ts`
4. Copy package.json template
5. Copy index.ts exports

**Time**: ~1 hour

### Test Shared Types

```bash
cd shared-types
npm install zod  # Only dependency
```

Verify no errors:

```bash
npx tsc --noEmit
```

---

## Day 2: Morning (2 hours)

### Update Backend to Use Shared Types

**Step 1: Update imports in existing files**

In `backend/src/validations/public/login.ts`:

```typescript
// Old:
import z from 'zod'
import { emailSchema, passwordSchema } from '@/validations'

export const validationSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

// New:
import { loginValidation } from '@shared-types/validations'
export const validationSchema = loginValidation
```

Do the same for:

- `sign-up.ts`
- `forget-password.ts`
- `reset-password.ts`

**Step 2: Update tsconfig.json**

In `backend/tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@shared-types/*": ["../shared-types/*"] // ADD THIS
    }
  }
}
```

**Step 3: Test it works**

```bash
cd backend
npm run lint
npm run type-check
```

Fix any import errors.

---

## Day 2: Afternoon (2 hours)

### Update Frontend to Use Shared Types

**Step 1: Update tsconfig.json**

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@shared-types/*": ["../shared-types/*"] // ADD THIS
    }
  }
}
```

**Step 2: Update imports in components**

In `frontend/src/lib/validations/auth.ts`:

```typescript
// Old: Define all schemas locally
export const emailSchema = z.string().email()
export const passwordSchema = z.string().min(8)
// ... etc

// New: Import from shared
export {
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  type LoginFormData,
  type SignupFormData
} from '@shared-types/validations'
```

In `frontend/src/types/auth.ts`:

```typescript
// New: Import from shared
export type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserProfile
} from '@shared-types/types'
```

**Step 3: Test it works**

```bash
cd frontend
npm run lint
npm run build
```

Fix any import errors.

---

## Day 3: Linting Setup (1-2 hours)

### Backend ESLint Config

**Step 1: Rename config file**

```bash
cd backend
mv eslint.config.js eslint.config.ts
```

**Step 2: Replace content**

Use template from `ESLINT_GUIDE.md` - copy entire config

**Step 3: Run linting**

```bash
npm run lint
```

**Expected violations:**

- ~20-50 missing return types
- A few other issues

**Step 4: Fix violations**

```bash
npm run lint:fix  # Auto-fixes what it can
```

Then manually add return types:

```typescript
// Find functions without return type and add:
const handler = async (event): Promise<ResponseType> => {
  // ...
}
```

Use your IDE's suggestions (Cmd/Ctrl + . to see quick fixes)

**Step 5: Verify clean**

```bash
npm run lint
npm run type-check
```

Both should pass with zero errors.

### Frontend ESLint Config

Same steps but for frontend:

```bash
cd frontend
# Update eslint.config.mjs with template from ESLINT_GUIDE.md
npm run lint
npm run lint:fix
# Manually add return types to components and hooks
npm run lint
```

---

## Day 4: Create Backend Feature Structure (3-4 hours)

### Create folders

```bash
cd backend/src
mkdir -p features/auth/{services,hooks,types}
```

### Move files gradually

**DON'T delete originals yet** - move one at a time:

1. Create `features/auth/auth.types.ts`

   - Copy content from IMPLEMENTATION_GUIDE.md
   - Add any backend-specific types

2. Create `features/auth/auth.validation.ts`

   - Should just import from shared-types
   - Re-export for convenience

3. Create `features/auth/token.service.ts`

   - Copy content from IMPLEMENTATION_GUIDE.md
   - Test imports work

4. Create `features/auth/auth.service.ts`

   - Copy content from IMPLEMENTATION_GUIDE.md
   - Update imports for DatabaseCollection, error handling

5. Create `features/auth/auth.handler.ts`

   - Copy content from IMPLEMENTATION_GUIDE.md
   - Update to match your error handling patterns

6. Create `features/auth/index.ts`
   - Re-export everything

### Update routes to use new structure

In `backend/src/routes/public/index.ts`:

```typescript
// Old
import loginHandler from '@/handlers/rest-api/public/login'

// New
import { loginHandler } from '@/features/auth'
```

### Test it works

```bash
npm run dev
curl http://localhost:9999/v1/auth/login  # Should work
npm run lint
npm run type-check
```

### Only then delete old files

Once tests pass, delete:

- `src/handlers/rest-api/public/login.ts`
- `src/handlers/rest-api/public/sign-up.ts`
- `src/validations/public/` folder
- Old `src/services/auth.ts`
- `src/models/user.model.js`

---

## Day 5: Create Frontend Feature Structure (3-4 hours)

### Create folders

```bash
cd frontend/src
mkdir -p features/auth/{components,hooks,services,types,validations}
mkdir -p shared/{api,components,types,hooks,constants}
```

### Move components

Move these files:

```
frontend/src/components/auth/LoginForm.tsx → features/auth/components/LoginForm.tsx
frontend/src/components/auth/SignupForm.tsx → features/auth/components/SignupForm.tsx
frontend/src/components/auth/ForgetPasswordForm.tsx → features/auth/components/ForgetPasswordForm.tsx
frontend/src/components/auth/ResetPasswordForm.tsx → features/auth/components/ResetPasswordForm.tsx
```

Update imports inside each:

```typescript
// Old
import { loginSchema, type LoginFormData } from '@/src/lib/validations/auth'
import { login } from '@/src/lib/api/auth'

// New
import { loginValidation, type LoginValidationType } from '../validations/auth.validation'
import { authService } from '../services/auth.service'
```

### Create feature files

Using templates from IMPLEMENTATION_GUIDE.md:

1. Create `features/auth/services/auth.service.ts`
2. Create `features/auth/hooks/useAuth.ts`
3. Create `features/auth/hooks/useLogin.ts`
4. Create `features/auth/types/auth.types.ts` (import from shared)
5. Create `features/auth/validations/auth.validation.ts` (import from shared)
6. Create `features/auth/index.ts` (exports)

### Update pages

In `frontend/src/app/auth/page.tsx`:

```typescript
// Old
import LoginForm from '@/src/components/auth/LoginForm'

// New
import { LoginForm } from '@/features/auth/components/LoginForm'
```

### Test it works

```bash
npm run dev
# Test login page loads
# Test form validation
npm run lint
npm run build
```

---

## After 5 Days

You should have:
✅ Single source of truth for types (shared-types)  
✅ Single source of truth for validations  
✅ Feature-based organization (backend and frontend)  
✅ Strict ESLint & TypeScript enforcement  
✅ All functions have explicit return types  
✅ No code duplication  
✅ Backend and frontend in sync

---

## What NOT to Do

❌ Don't try to do everything in one day  
❌ Don't delete old files before testing new ones  
❌ Don't skip running tests after each change  
❌ Don't ignore linting errors - fix them  
❌ Don't move multiple files at same time  
❌ Don't skip the documentation

---

## If You Get Stuck

1. **Import errors?**

   - Check paths in tsconfig.json
   - Verify file exists in new location
   - Clear node_modules and reinstall

2. **Type errors?**

   - Use IDE quick fixes (Cmd/Ctrl + .)
   - Check type definition in shared-types
   - Make sure backend and frontend use same types

3. **ESLint errors?**

   - Read the rule name: `@typescript-eslint/xxx`
   - Go to ESLINT_GUIDE.md
   - See explanation and fix

4. **Linting won't pass?**
   - Run `npm run lint:fix` first
   - Then manually fix remaining issues
   - Check for floating promises (add `await`)
   - Add explicit return types

---

## Commands Reference

```bash
# Check everything
npm run lint && npm run type-check && npm run build

# Quick check while developing
npm run lint
npm run type-check

# Auto-fix what you can
npm run lint:fix

# Format code
npm run format

# Start development
npm run dev

# Full build test
npm run build
```

---

## Success Metrics

After 5 days, measure:

```bash
# Backend
cd backend
npm run lint          # Should show: 0 errors
npm run type-check    # Should show: 0 errors
npm run dev           # Should start without errors
curl http://localhost/v1/auth/login -X POST  # Should work

# Frontend
cd frontend
npm run lint          # Should show: 0 errors
npm run build         # Should succeed
npm run dev           # Should start without errors
```

All should be ✅

---

## Questions to Ask Yourself

- [ ] Do I understand the folder structure?
- [ ] Do I see why shared types matter?
- [ ] Am I comfortable with the linting approach?
- [ ] Do I have all the code templates?
- [ ] Am I ready to start tomorrow?

If any are ❌, re-read the relevant guide before starting.

---

**Ready to start? Begin with Day 1 Morning.**

Good luck! 🚀
