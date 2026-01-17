## Architecture: Unified Real-Time Communication System

### 1. High-Level Blueprint

We will move from a fragmented, route-specific architecture to a **Global Singleton Pattern** for connectivity and a **Finite State Machine (FSM)** for call orchestration.

```mermaid
graph TD
    A[Root Layout] --> B[GlobalSocketProvider]
    B --> C[Main App Content]
    B --> D[GlobalNotificationLayer]
    
    C --> E[CallOrchestrator (The "Brain")]
    
    subgraph "Unified Call Engine (Component)"
        E --> F{State Machine}
        F -->|State: CHECK_DEVICES| G[HardwareGate]
        F -->|State: INTERMISSION| H[DecisionOverlay]
        F -->|State: ACTIVE| I[AgoraContainer]
    end
    
    subgraph "Data Sources"
        J[Live Queue Service] -->|Match Found| E
        K[Chat Action] -->|Start Staged Call| E
    end
```

### 2. Core Concepts

1.  **`GlobalSocketProvider`**: A single context provider wrapping `layout.tsx`. It holds the single `Socket` instance and exposes methods to join/leave rooms globally. It manages "Global Presence" (online status).
2.  **`CallOrchestrator`**: A specific component mounted at the root (or persistent layout level) that listens for `incoming-call` events. It conditionally renders the call interface *over* current content, preventing navigation refreshes.
3.  **`useCallStateMachine`**: A custom hook managing the transition logic:
    *   `IDLE` → `CHECKING_DEVICES` → `CONNECTING` → `STAGE_ACTIVE` → `INTERMISSION` → `NEXT_STAGE` or `FINISHED`.
4.  **Hardware Gating**: A strict utility that runs `navigator.mediaDevices.getUserMedia` *before* the call UI initializes, rejecting the flow if permissions fail.

---

## 📅 Implementation Roadmap

### Phase 1: The Global Socket Foundation
**Goal:** Establish a single source of truth for real-time events.

1.  **Create `src/features/realtime/context/GlobalSocketContext.tsx`**
    *   Initialize Socket.io client here.
    *   Handle authentication (attach JWT).
    *   Expose `socket`, `isConnected`, `connect()`, `disconnect()`.
    *   *Constraint Check:* Keep under 160 lines. Extract event listeners to `src/features/realtime/handlers/`.
2.  **Refactor `src/app/[locale]/layout.tsx`**
    *   Wrap the application with `<GlobalSocketProvider>`.
    *   Remove existing socket logic from `features/swipe` and `features/home`.
3.  **Implement `GlobalNotificationListener`**
    *   Create a component that listens for `notification` events inside the provider.
    *   Display Toasts regardless of current route.

### Phase 2: The Unified Call Engine (UI & Logic)
**Goal:** Create the "Shell" that handles both Live and Staged calls without navigation.

1.  **Create `src/features/call-system/components/UnifiedCallInterface.tsx`**
    *   This is the parent container. It does NOT contain Agora logic directly.
    *   It renders sub-components based on state.
2.  **Implement `src/features/call-system/hooks/useCallFSM.ts`**
    *   Manages the internal state of the call.
    *   Handles "Next Stage" logic (incrementing stage number vs. routing).
3.  **Create `src/features/call-system/components/HardwareGate.tsx`**
    *   Checks Mic/Cam permissions.
    *   Shows a "Pre-flight" UI (e.g., "Allow Camera to continue").
    *   Returns `ready: boolean`.

### Phase 3: In-Place Stage Orchestration
**Goal:** Solve the "Return to Chat" bad UX.

1.  **Refactor `IntermissionOverlay.tsx`**
    *   Instead of a modal that redirects, this component will now overlay the video container.
    *   **Crucial:** When this component mounts, it must call `agoraEngine.muteLocalAudioStream(true)` and `muteLocalVideoStream(true)`.
2.  **Update `StageProgressLogic`**
    *   When Stage 1 ends:
        *   Backend emits `stage-ended`.
        *   Frontend FSM enters `INTERMISSION`.
        *   UI shows "Proceed to Stage 2?" buttons.
    *   If both accept:
        *   Frontend FSM enters `STAGE_ACTIVE` (Stage 2).
        *   Unmute Audio/Video.
        *   Timer resets.

### Phase 4: Integration & "Kill List" Cleanup
**Goal:** Connect the new engine to existing triggers.

1.  **Connect `LiveCall` Trigger**
    *   Update `src/features/live-call/queue.tsx`: When match is found, instead of `router.push('/video')`, invoke `callOrchestrator.startSession(matchId, 'live')`.
2.  **Connect `Chat` Trigger**
    *   Update `src/features/chat/components/ChatHeader.tsx`: "Start Call" button invokes `callOrchestrator.startSession(matchId, 'staged')`.
3.  **Delete Legacy Code**
    *   Remove old `features/video/` page routes that forced navigation.
    *   Remove isolated socket wrappers in `swipe`.

---

## ✅ Verification Plan (Definition of Done)

Before declaring any phase complete, we will verify:

> - [ ] **Socket Singleton:** Verify `socket.id` remains constant when navigating from Home → Chat → Profile.
> - [ ] **Global Reach:** Verify a "Call Request" toast appears even while the user is editing their Profile.
> - [ ] **Device Safety:** Verify the call FAILS gracefully if the user denies Camera permission (does not hang or show black screen).
> - [ ] **Privacy:** Verify standard Agora mute methods are called during the "Intermission" (Decision) phase.
> - [ ] **Zero Navigation:** Verify the URL does *not* change when moving from Stage 1 to Stage 2.
> - [ ] **Kill List Compliance:** Ensure no file in the new `call-system` exceeds 160 lines.


REASONING 
*TASK: Develop a multi-phase Architectural Migration Plan to refactor the Flint Real-time Infrastructure and Staged Call Flow into a robust, scalable, and unified system.

Current Issues:
Socket Management:

Socket wrapper is scoped within the swipe route, so I cannot receive notifications or incoming call requests from other routes
Live call section has its own live call service with queueing that works fine
Two different socket wrappers exist - I need one root-level socket per user to receive live messages from everywhere
Upcoming staged call requests should be visible across all routes

Call Flow Problems:

Stage 1 completes → returns to chat → Stage 2 toast doesn't advance to Stage 2
Requires hard refresh → click start Stage 2 → shows request modal → then video call component
Each individual stage works fine, but the stage transition process is mechanical and broken
Before starting each stage, need technical readiness checks (microphone/camera availability) - if devices aren't available, don't allow the call to start

Desired Flow:

Currently: Stage 1 → Stage 3 returns to chat section after each stage to request next stage approval (not good UX)
Wanted: After each stage completes, the next stage request should appear inside that same stage component without navigation
If either user doesn't accept → return to chat section
If both accept → smooth transition to next stage
In Stage 2 video call, when done, show next stage request within that component
Important: Microphone and cameras should be OFF during the request/approval screens

Component Consolidation:

Live call section uses a different component than staged call component
Have to use ONE staged call component for both swipe section and live section ? 
Main difference: Live call has queue service, swipe starts staged call between two matched people

ARCHITECTURAL CHALLENGES TO SOLVE:
1. Root-Level Socket Singleton: Replace fragmented feature-scoped socket wrappers with a single `GlobalSocketProvider` at the root layout. Ensure event propagation for calls and notifications is accessible across all routes (Chat, Swipe, Profile, Home).
2. Unified Call Engine: Consolidate "Live Call" (queue-based matchmaking) and "Staged Call" (direct match pairings) into a single modular component logic.
3. In-Place Stage Orchestration:Eliminate "return to chat" navigation between Stage 1, 2, and 3. Implement an internal state machine that handles inter-stage approvals within the active call component.
4. Hardware Readiness Gate: Implement a pre-call validation layer to check microphone/camera availability and permissions before allowing a transition to an active state.
5. Media Privacy Control: Ensure audio/video tracks are programmatically muted/disabled during decision overlays between stages.


What I Need:
A comprehensive architectural plan to refactor the Socket.IO and real-time wrappers to make this possible. The plan should be split into phases to ship the refactor safely and efficiently.



OUTPUT NEEDED:
- A high-level Architectural Blueprint for the new system.
- A Phase-by-Phase Implementation Roadmap with specific technical steps for each.
- A Verification Planusing the project's "Definition of Done" checklist.