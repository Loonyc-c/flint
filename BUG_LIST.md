**1. Fix Login Redirection & Loading State**

- **Problem:** After successful login, the app redirects to Home but gets stuck on an infinite loading screen unless the user performs a hard refresh.
- **Requirement:** Investigate the Auth Provider/Context and Router logic. Ensure the application state updates correctly upon navigation without requiring a page reload. Verify `useEffect` dependencies in the main layout or auth wrapper.

**2. Debug Live Call Matching Logic (Staged Call)**

- **Problem:** In the "Staged Call" service:
  - **User A:** Sees "Finding Match" indefinitely.
  - **User B:** Sees "Found Match" but gets stuck on "Connecting".
  - _Result:_ The session never transitions to "Stage 1".
- **Requirement:** Debug the Socket.io event flow (`match_found`, `connection_established`, `stage_start`). Ensure bidirectional event acknowledgments are working and the state machine on both clients synchronizes correctly.

**3. Implement Manual Contact Info Input (Profile)**

- **Context:** Instagram verification is currently unavailable.
- **Requirement:**
  - Add a simple text input field to the User Profile creation/edit flow for "Contact Info" (e.g., phone/email/handle).
  - Update the Backend User Schema and DTOs to accept and save this string field.
  - Remove/Hide the Instagram verification requirement for now.

**4. Refactor Swipe Card UI (Mobile Responsiveness)**

- **Problem:** The Swipe Card component is not scrollable on mobile. Users cannot view the full profile (bio, recorded audio, interests) because the card height is fixed or overflow is hidden.
- **Requirement:** Refactor the Swipe Card layout.
  - **Do not apply a hotfix.**
  - **Goal:** Ensure the card content is scrollable within the viewport or the layout adapts to fit long content on small screens (e.g., using a scrollable container within the card body).
  - **Focus:** Mobile-first user experience.

**OUTPUT NEEDED:**

- Modified code snippets for each task (file paths included).
- Explanation of the root cause for the Login and Socket issues.
- Updated Schema/Interface definitions for the Contact Info.
