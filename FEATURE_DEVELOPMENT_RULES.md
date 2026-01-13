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
4.  **Localization:** **ZERO Hardcoded Strings.**
    *   ❌ **Forbidden:** `<span>Login</span>` or `placeholder="Enter email"`
    *   ✅ **Required:** `<span>{t('auth.login')}</span>` or `placeholder={t('auth.emailPlaceholder')}`
    *   All user-facing text MUST be managed via `src/messages/en.json` and `src/messages/mn.json`.
    *   **Data Integrity:** ALWAYS separate localized **Display Labels** from **Internal Values** (Enums/Types). The backend MUST receive stable keys (e.g., `"female"`, `"GYM"`), never localized text (e.g., `"эмэгтэй"`, `"Фитнесс"`).
5.  **Theming:** **ZERO Hardcoded Colors.**
    *   ❌ **Forbidden:** `bg-[#B33A2E]`, `text-white`, `border-gray-200`, `bg-neutral-100`.
    *   ✅ **Required:** `bg-brand`, `text-foreground`, `border-border`, `bg-muted`.
    *   All colors MUST be semantic and mapped in `src/app/globals.css`.

---

## 2. 🎨 Frontend Guidelines (Next.js 15)

### Theming & Design System (Mode-Aware)
The app uses `next-themes` and Tailwind v4. Components must support Dark/Light modes automatically.

| **Semantic Category** | **Tailwind Classes** | **Usage** |
| :--- | :--- | :--- |
| **Surfaces** | `bg-background`, `bg-card`, `bg-muted`, `bg-secondary` | Main app background, cards, and subtle sections. |
| **Text** | `text-foreground`, `text-muted-foreground`, `text-brand-foreground` | Primary text, secondary/placeholder text, and text on brand backgrounds. |
| **Borders** | `border-border`, `border-input` | Dividers, card borders, and form inputs. |
| **Accents** | `bg-brand`, `text-brand`, `bg-accent`, `bg-info`, `bg-success`, `bg-warning` | Primary brand colors and semantic status indicators. |

**Centralized Truth:** If a required color is missing, add it to `:root` and `.dark` in `globals.css` as a semantic variable. NEVER hardcode a hex value or literal Tailwind color (e.g., `zinc-500`) in a component.

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

---

## 4. 🔌 Real-time & Socket Standards (Socket.io)

### Event Naming & Payloads
*   **Pattern:** Use kebab-case for events: `feature-action` (e.g., `live-call-join`, `chat-message-sent`).
*   **Context:** ALWAYS include a `matchId` or session-specific ID in payloads to allow for targeted emissions.

### State Management & Cleanup
*   **Mandatory Cleanup:** Every socket handler MUST implement a `disconnect` listener to purge the user from any in-memory state (Queues, Active Call Maps).
*   **Memory vs. Persistence:** In-memory `Map/Set` is allowed for high-frequency matchmaking but MUST be documented as a candidate for Redis migration if horizontal scaling is required.

### Ephemeral IDs
*   **Prefixing:** IDs generated outside of MongoDB (e.g., UUIDs for temporary sessions) MUST be prefixed (e.g., `live_`, `tmp_`) to distinguish them from ObjectIds in logs and shared types.

### Agora Integration
*   **Numeric UIDs:** Agora requires numeric UIDs. ALWAYS use `agoraService.generateNumericUid(userId)` when interacting with RTC channels to maintain consistency between string-based MongoDB IDs and numeric RTC requirements.

---

## 5. 📝 Execution Workflow (CoT)

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

> - [ ] **Localization:** Zero hardcoded strings? (All text in JSON)

> - [ ] **Theming:** Zero hardcoded colors? (Used semantic variables)

> - [ ] **Architecture:** Feature folder structure respected?

> - [ ] **Responsive:** Layout is stable and uses viewport-aware units?
