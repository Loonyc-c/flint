# Documentation: Live Call Matchmaking Feature

The **Live Call** feature enables real-time, ephemeral pairings between users based on mutual preferences. This feature has been refactored to use the **Unified Call Engine**, separating matchmaking logic from media orchestration.

---

## 🛠 Tech Stack
- **Real-time Communication**: Socket.io (Signaling), Agora RTC (Media)
- **Engine**: Unified Call FSM (Frontend Orchestration)
- **Backend Logic**: Node.js (In-memory Queue Service)
- **Database**: MongoDB (Formal Match Promotion)
- **Frontend**: Next.js, Framer Motion, Tailwind CSS

---

## ⚙️ Working Logic

### 1. Matchmaking Engine (`LiveCallQueueService`)
- **Queueing**: Users enter an in-memory queue with profile data (age, gender) and preferences (`lookingFor`, `ageRange`).
- **Filtering**: The engine performs bi-directional matching:
  - **Gender**: `User A`'s gender matches `User B`'s `lookingFor`, and vice-versa.
  - **Age**: `User A`'s age is within `User B`'s `ageRange`, and vice-versa.
- **Pairing**: Matches are immediately removed from the queue and assigned a unique `matchId`.

### 2. Connection Flow (Refactored)
1. **Queueing**: User joins via `live-call-join` socket event. UI enters the `queueing` state.
2. **Signal**: Backend emits `live-call-match-found` with an ephemeral `matchId` and Agora credentials.
3. **Orchestration Delegation**: The `useLiveCall` hook invokes the **Unified Call Engine** via `startCall()`.
4. **Media Session**: 
   - The engine handles **Device Checks** (Camera/Mic permissions).
   - The engine establishes the **Agora Connection**.
   - The engine renders the **Active Call UI** with a 90-second countdown.
5. **Stage Transition**: When the timer ends, the engine enters the `INTERMISSION` state, muting streams in-place.
6. **Promotion**: If both users "Connect", a permanent match is created in MongoDB.

---

## 🏗 Modular Architecture

### Separation of Concerns
| Responsibility | Layer | Component/Hook |
| :--- | :--- | :--- |
| **Matchmaking** | Backend Service | `LiveCallQueueService.ts` |
| **Signaling** | Socket Handler | `live-call.handler.ts` |
| **Queue State** | Frontend Hook | `useLiveCall.ts` |
| **Media/UI** | Unified Engine | `UnifiedCallInterface.tsx` |
| **State Machine** | Orchestrator | `useCallFSM.ts` |

### Benefits of Refactor
- **Consistency**: Live calls use the exact same pre-flight (device check) and active call components as Staged calls.
- **Reliability**: All Agora logic is centralized in one place (`ActiveCallContainer.tsx`).
- **Performance**: No navigation required; transitions occur as state changes within the same viewport.

---

## 🚀 Future Implementations

### 1. Scalability
- **Redis Queue**: Move the `WaitingQueue` to Redis to support horizontally scaled backend instances.

### 2. User Experience (UX)
- **Blur-to-Clear Video**: Implement a video stage where the stream starts heavily blurred and gradually clears as the timer progresses.
- **AI Icebreakers**: Display real-time conversation starters based on mutual interest tags.

---

## 📂 File Reference
- **Backend Service**: `backend/src/features/realtime/services/live-call-queue.service.ts`
- **Socket Handler**: `backend/src/features/realtime/handlers/live-call.handler.ts`
- **Frontend Hook**: `frontend/src/features/live-call/hooks/useLiveCall.ts`
- **UI Components**: `frontend/src/features/call-system/components/UnifiedCallInterface.tsx`
