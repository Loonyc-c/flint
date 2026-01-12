# AI Agent Feature Development Rules

This document outlines the strict architectural and coding standards for AI agents working on the **Flint** monorepo (Frontend, Backend, Shared).

--

# System Instruction: Flint Monorepo Architect

 the **Flint** project (Next.js 15 Frontend, Express Backend, Shared Monorepo). Your primary directive is to enforce strict modularity and modern syntax standards.

## 🚨 Zero-Tolerance Constraints (The "Kill List")
*If generated code violates these, it is considered a failure.*

1.  **Syntax:** **Arrow Functions ONLY.**
    *   ❌ **Forbidden:** `function MyComponent() {}` or `async function handler() {}`
    *   ✅ **Required:** `const MyComponent = () => {}` or `const handler = async () => {}`
2.  **File Size:** **Max 160 lines.**
    *   If a file approaches this limit, you **MUST** pause and decompose logic into `components/` (sub-components) or `hooks/` (logic). **Do not ask for permission; just do it.**
3.  **Imports:**
    *   **Shared:** NEVER redefine types/schemas. ALWAYS import from `@shared/types` or `@shared/validations`.
    *   **Navigation:** NEVER import from `next/navigation`. ALWAYS import from `@/i18n/routing`.

---

## 2. 🎨 Frontend Guidelines (Next.js 15)

### Routing & Navigation (i18n Strict)
The app uses `next-intl` routing. Standard Next.js routing breaks locale prefixes.

| ❌ **Do Not Use** | ✅ **Use Instead** |
| :--- | :--- |
| `import { useRouter } from 'next/navigation'` | `import { useRouter } from '@/i18n/routing'` |
| `import Link from 'next/link'` | `import { Link } from '@/i18n/routing'` |
| `import { redirect } from 'next/navigation'` | `import { redirect } from '@/i18n/routing'` |

### Feature Architecture
Organize by **Feature**, not by Type.
*   📂 `src/features/auth/`
    *   📂 `components/` (UI - split into Smart/Dumb)
    *   📂 `hooks/` (State, `react-hook-form`, effects)
    *   📂 `api/` (Axios calls)
    *   📄 `index.ts` (Public export)

### Forms & Validation
*   **Stack:** `react-hook-form` + `zod` + `@hookform/resolvers/zod`.
*   **Pattern:**
    ```typescript
    import { loginSchema } from '@shared/validations/auth.validation';
    // ...
    const { register, handleSubmit } = useForm({
      resolver: zodResolver(loginSchema) // 👈 MUST use shared schema
    });
    ```

### Responsive Consistency (Layout Stability)
To ensure stability across all devices and prevent scrollbar issues:
1.  **No Static Heights:** NEVER use fixed pixel heights (e.g., `h-[600px]`) for layout containers.
2.  **Viewport Handling:** Use `min-h-[calc(100dvh-headerHeight)]` instead of `min-h-screen` to account for sticky headers and avoid overflow on mobile.
3.  **Content-First Expansion:** Layouts must expand based on their children. Use `aspect-ratio` for elements that need a specific shape (like cards) to ensure they scale proportionally.
4.  **Responsive Spacing:** Always use responsive padding and margins (e.g., `p-4 sm:p-10`) to maintain UX quality on smaller viewports.

---

## 3. ⚙️ Backend Guidelines (Express)

### Architecture Patterns
*   **Controller/Service Separation:**
    *   **Handlers (`handlers/`):** Parse `req`, validate Zod schemas, call Service, send `res`.
    *   **Services (`services/`):** Pure business logic. No `req`/`res` objects.
*   **Context:** User session data is always in `req.context` (not `req.user`).

### Error Handling
*   Wrap **ALL** async handlers with a higher-order function (e.g., `catchAsync`).
*   Throw named errors: `throw new AppError('Message', 400)`.

---

## 4. 📝 Execution Workflow (CoT)

When presented with a coding task, follow this internal process:

1.  **Analyze Context:** Read `@shared/types` to see what already exists.
2.  **Check Size:** Estimate if the solution will exceed 160 lines.
    *   *If yes:* Immediate plan for decomposition (e.g., "I will extract `UserAvatar` and `ProfileForm` components").
3.  **Implement:** Write code using **Arrow Functions**.
4.  **Verify:** Check imports (especially `@/i18n/routing` vs `next/navigation`).

---

## 5. Definition of Done Checklist

*Append this validation to your response:*

> - [ ] **Syntax:** All functions are arrow functions?
> - [ ] **Size:** All files < 160 lines?
> - [ ] **DRY:** Used `@shared/types` & `@shared/validations`?
> - [ ] **i18n:** Used `@/i18n/routing` for all navigation?
> - [ ] **Architecture:** Feature folder structure respected?
> - [ ] **Responsive:** Layout is stable and uses viewport-aware units?