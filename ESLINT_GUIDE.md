# ESLint vs ts-standard: Decision & Implementation

## Executive Answer

**❌ Don't use ts-standard**  
**✅ Use @typescript-eslint with custom config**

---

## Why NOT ts-standard?

### 1. **Limited Customization**

- ts-standard is opinionated and rigid
- Hard to override specific rules
- No support for TypeScript-specific checks you need

### 2. **Overlaps with Prettier**

- ts-standard includes formatting rules
- You already use Prettier for formatting
- This creates conflicts and redundancy

### 3. **Not Modern**

- Built for older ESLint versions
- Missing new TypeScript features
- Slower development/maintenance

### 4. **Lacks Return Type Enforcement**

```typescript
// ts-standard WON'T enforce this
const handler = async event => {
  return { data: 'user' }
  // ^ Type inferred, not explicit - PROBLEM
}

// But @typescript-eslint/explicit-function-return-types WILL enforce:
const handler = async (event): Promise<UserResponse> => {
  return { data: 'user' }
  // ^ Type is explicit - GOOD
}
```

### 5. **Community & Support**

- @typescript-eslint is maintained by TypeScript core team
- Larger community
- Better documentation
- More integrations

---

## Why USE @typescript-eslint?

### 1. **Comprehensive Type Coverage**

```typescript
Rules enforced:
✅ explicit-function-return-types       (your need #1)
✅ explicit-module-boundary-types       (exports must have types)
✅ no-explicit-any                       (no cheating with any)
✅ no-floating-promises                  (await everything async)
✅ await-thenable                        (don't forget await)
✅ strict-boolean-expressions            (no truthy/falsy logic)
✅ no-misused-promises                   (promises used correctly)
```

### 2. **Works with Prettier**

- ESLint handles code quality (types, logic)
- Prettier handles formatting (spaces, semicolons)
- No conflicts, clear separation

### 3. **Type-Aware Linting**

- Understands your TypeScript types
- Catches type-related bugs
- Requires `tsconfig.json` to be loaded

### 4. **Highly Customizable**

```typescript
{
  rules: {
    '@typescript-eslint/explicit-function-return-types': [
      'error',                    // Enforce strictly
      {
        allowExpressions: true,  // Allow inline functions
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }
    ]
  }
}
```

### 5. **Future-Proof**

- Active maintenance
- Regular updates
- Tracks TypeScript evolution

---

## What You Need: Return Type Enforcement

### Current Problem in Your Code

**Backend:**

```typescript
// handlers/rest-api/public/login.ts
const handler = async (event: NormalizedEvent) => {
  const { body } = event
  try {
    const { email, password } = validationSchema.parse(body)
    const user = await authService.authenticateUser(email, password)
    return {
      accessToken,
      name,
    }
    // ❌ Return type not explicit
    // ❌ IDE doesn't know what type this returns
    // ❌ If you change this, it breaks consumers silently
  }
}
```

**Frontend:**

```typescript
// lib/api-client.ts
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}) {
  // ...
  const response = await fetch(url, { ...options })
  // ❌ Function return type not declared
  // ❌ Callers must know it returns Promise<T>
  // ❌ No type safety guarantee
}
```

### With @typescript-eslint Config

ESLint forces you to write:

**Backend:**

```typescript
import type { LoginResponse } from '@shared-types/types'

const handler = async (event: NormalizedEvent): Promise<LoginResponse> => {
  //                                              ↑ EXPLICIT return type
  const { body } = event
  try {
    const { email, password } = validationSchema.parse(body)
    const user = await authService.authenticateUser(email, password)
    return {
      accessToken,
      name,
    }
    // ✅ Type is explicit and enforced
    // ✅ Compiler verifies return matches type
    // ✅ IDE knows exact return type
    // ✅ Refactoring is safe
  }
}
```

**Frontend:**

```typescript
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  //             ↑ EXPLICIT return type
  const url = `${API_BASE_URL}${endpoint}`
  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      credentials: 'include'
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(
        0,
        'Network error: Could not connect to server. Please check if the server is running.',
        false
      )
    }
    throw error
  }

  let responseData: ApiResponse<T> | ApiErrorResponse
  try {
    responseData = await response.json()
  } catch (parseError) {
    // ...
  }

  return responseData as T
}
// ✅ Return type explicitly declared
// ✅ All code paths verified
// ✅ Consumers know what they get
```

---

## Implementation: Step-by-Step

### Step 1: Update Dependencies

**Backend `package.json`:**

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.51.0",
    "@typescript-eslint/parser": "^8.51.0",
    "typescript-eslint": "^8.51.0",
    "eslint": "^9.39.2",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.4",
    "prettier": "^3.7.4"
  }
}
```

**Already have these** ✅

### Step 2: Convert Config File

**Rename**: `backend/eslint.config.js` → `backend/eslint.config.ts`

**Content**:

```typescript
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    files: ['**/*.ts'],
    ignores: ['node_modules/**', 'dist/**', 'lib/**', 'coverage/**']
  },
  // This is the key - recommended with type checking
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,

  // Configure TypeScript parser with project
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: process.cwd()
      }
    }
  },

  // Your custom rules
  {
    rules: {
      // ===== Type Safety (CRITICAL) =====
      '@typescript-eslint/explicit-function-return-types': [
        'error', // Not warning - ENFORCE
        {
          allowExpressions: true, // foo?.bar?.baz() is OK
          allowTypedFunctionExpressions: true, // const x = (): string => {} is OK
          allowHigherOrderFunctions: true // (x) => (y) => z is OK
        }
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // ===== Avoid Typing Shortcuts =====
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Allow _unused parameters
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],

      // ===== Async/Promise Safety (CRITICAL) =====
      '@typescript-eslint/no-floating-promises': 'error', // Must await
      '@typescript-eslint/await-thenable': 'error', // Only await promises
      '@typescript-eslint/no-misused-promises': 'error', // Promise usage correct

      // ===== Strict Boolean Logic =====
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: false, // Don't use strings in boolean context
          allowNumber: false, // Don't use numbers
          allowNullableObject: false // Be explicit
        }
      ],

      // ===== Logging =====
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // ===== From Prettier =====
      ...prettierConfig.rules
    }
  },

  // Prettier's ESLint config (prevents conflicts)
  prettierConfig
)
```

### Step 3: Update `package.json` Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.ts\""
  }
}
```

### Step 4: Update `tsconfig.json`

Add this section to enable type-aware linting:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
    // ... rest of your config
  }
}
```

### Step 5: Run & Fix

```bash
cd backend

# See all violations
npm run lint

# Auto-fix what can be fixed
npm run lint:fix

# Check types
npm run type-check

# Manually fix remaining issues (return types, etc.)
# Then verify
npm run lint && npm run type-check
```

### Expected Violations to Fix

Your code will initially report:

1. **Missing return types** (~30-50 violations)

   ```typescript
   // Error: Missing return type
   const handler = async (event) => { ... }

   // Fix:
   const handler = async (event): Promise<Response> => { ... }
   ```

2. **No explicit-any** (if you have any)

   ```typescript
   // Error: Use of 'any'
   const result: any = data

   // Fix:
   const result: UnknownType = data
   ```

3. **Floating promises**

   ```typescript
   // Error: Floating promise
   someAsyncFunction()

   // Fix:
   await someAsyncFunction()
   // or
   void someAsyncFunction() // if intentional
   ```

---

## Frontend: Same Approach

**`frontend/eslint.config.mjs`:**

```javascript
import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['.next/**', 'node_modules/**']
  },
  tseslint.configs.recommendedTypeChecked,
  nextPlugin.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: process.cwd()
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-types': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@next/next/no-html-link-for-pages': 'off'
    }
  },
  prettierConfig
)
```

---

## Benefits You Get

### Before (Current State)

```
❌ Handler functions: Type inferred
❌ No return type enforcement
❌ Missing return types discovered at runtime
❌ ESLint warnings (easy to ignore)
❌ TypeScript errors not all caught
```

### After (With New ESLint)

```
✅ Handler functions: Type explicit
✅ All functions have declared return types
✅ Type mismatches caught at lint time
✅ ESLint errors (must fix to build)
✅ Strict type safety throughout
✅ No `any` types allowed
✅ All promises must be awaited
✅ Boolean logic is explicit
```

---

## CI/CD Integration

Add to your build pipeline:

```bash
# Backend
npm run lint && npm run type-check && npm run build

# Frontend
npm run lint && npm run build

# Both must succeed before merge
```

---

## Common Questions

### Q: Will this slow down linting?

**A:** Slightly (due to type checking), but you get better errors. Cache helps.

### Q: What if I need to use `any`?

**A:** Use `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
Then add comment explaining why.

### Q: Do I need to update all files at once?

**A:** You can use `eslintIgnorePatterns` to gradual rollout, but better to do all at once.

### Q: How do I know return type for a handler?

**A:** Check what you're returning:

```typescript
// This returns LoginResponse
return { accessToken: string, name: string }

// So type it:
): Promise<LoginResponse>
```

---

## Summary

| Feature                 | ESLint + ts-eslint | ts-standard  |
| ----------------------- | ------------------ | ------------ |
| Return type enforcement | ✅ Yes             | ❌ No        |
| Type-aware linting      | ✅ Yes             | ❌ No        |
| Works with Prettier     | ✅ Yes             | ⚠️ Conflicts |
| Customizable            | ✅ Yes             | ❌ No        |
| Modern                  | ✅ Yes             | ❌ Outdated  |
| Community               | ✅ Large           | ❌ Small     |
| Active maintenance      | ✅ Yes             | ❌ Slow      |

---

**Recommendation**: Use `@typescript-eslint` with the config provided. It gives you the strict type safety you want.

**Time to implement**: ~2-3 hours to fix violations across codebase
