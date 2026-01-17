# Pre-Call Sequence UX State Plan

## Executive Summary

This document defines the **Transparent State Feedback** strategy for the Pre-Call Sequence in both Live Call (Queue-based) and Chat (Direct Request) flows. The goal is to ensure users never wonder "Is it working?" through specific, granular state updates.

---

## 1. Backend Verification ✅

### Code Cleanup Status (COMPLETE)

The Live Call backend has been successfully refactored to be a **lightweight, ephemeral matcher**:

- ✅ **Removed**: `ongoingCalls` Map (in-memory state tracking)
- ✅ **Removed**: `handleAction()` method (Like/Pass logic)
- ✅ **Removed**: Database imports (`getMatchCollection`, `DbMatch`)
- ✅ **Removed**: `LIVE_CALL_EVENTS.CALL_ACTION` listener
- ✅ **Retained**: Only `addToQueue`, `removeFromQueue`, `findMatch`, `isCompatible`

**File**: [live-call.service.ts](file:///home/battulga/Desktop/flint/backend/src/features/live-call/services/live-call.service.ts)  
**Lines**: 153 (reduced from 218)  
**Build Status**: ✅ Passing

---

## 2. FSM State Mapping

### Current FSM States (from call-fsm.ts)

```typescript
type CallState =
  | 'IDLE'           // No active call
  | 'PRE_FLIGHT'     // Hardware check (standalone)
  | 'CHECK_DEVICES'  // Hardware check (in-call flow)
  | 'CALLING'        // Outgoing call (waiting for accept)
  | 'INCOMING'       // Incoming call (showing accept/decline)
  | 'CONNECTING'     // Agora connection in progress
  | 'STAGE_ACTIVE'   // Active call
  | 'INTERMISSION'   // Between stages (staged calls)
  | 'FINISHED'       // Call ended
```

### Additional States Needed for Live Call

The `LiveCallContext` currently uses:
```typescript
type LiveCallStatus = 'idle' | 'queueing' | 'connecting' | 'in-call' | 'error' | 'ended'
```

**Integration Strategy**: Map `LiveCallStatus` to FSM states for unified UI rendering.

---

## 3. Live Call Flow - Transparent State Feedback

### State Progression

```
IDLE → PRE_FLIGHT → (queueing) → CONNECTING → STAGE_ACTIVE
```

### Detailed State Breakdown

| State | UI Component | Primary Text | Secondary Text | Visual Feedback | Duration |
|-------|-------------|--------------|----------------|-----------------|----------|
| **IDLE** | None | - | - | - | - |
| **PRE_FLIGHT** | `DeviceCheckScreen` | "Checking Hardware..." | "Please allow camera and microphone access" | Rotating camera/mic icon | 1-3s |
| **queueing** | `LiveCallQueueOverlay` | "Finding Your Match..." | "Searching for someone who matches your preferences" | Animated search ripples | Variable (0-60s+) |
| **CONNECTING** | `ConnectingScreen` | "Match Found!" | "Connecting to [Partner Name]..." | Partner avatar with pulse animation | 1-2s |
| **STAGE_ACTIVE** | `ActiveCallContainer` | - | - | Video grid | 90s |

### Implementation Details

#### State 1: PRE_FLIGHT (Hardware Check)
**Component**: `DeviceCheckScreen`  
**Trigger**: User clicks "Start Live Call"  
**Current Implementation**: ✅ Already exists  
**Text**:
- Checking: "Checking Hardware..."
- Success: "Ready!" → Auto-transition
- Error: "Permission Denied" + Retry button

**Code Location**: [DeviceCheckScreen.tsx:73](file:///home/battulga/Desktop/flint/frontend/src/features/call-system/components/DeviceCheckScreen.tsx#L73)

---

#### State 2: queueing (Finding Match)
**Component**: `LiveCallQueueOverlay` (needs creation)  
**Trigger**: Hardware check passes → `socket.emit(JOIN_QUEUE)`  
**Current Implementation**: ⚠️ Needs enhancement  
**Text**:
- Primary: "Finding Your Match..."
- Secondary: "Searching for someone who matches your preferences"
- Tertiary (after 10s): "Still searching... Average wait time: 30s"

**Visual Design**:
```tsx
<div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
  <motion.div className="text-center">
    {/* Animated search ripples */}
    <div className="relative w-32 h-32 mx-auto mb-8">
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-brand/30"
      />
      <SearchIcon className="absolute inset-0 m-auto w-12 h-12 text-brand" />
    </div>
    
    <h3 className="text-2xl font-bold text-white mb-2">
      Finding Your Match...
    </h3>
    <p className="text-white/60 mb-8">
      {waitTime > 10 ? `Still searching... Average wait: 30s` : `Searching for someone who matches your preferences`}
    </p>
    
    <button onClick={leaveQueue} className="px-8 py-3 rounded-full border border-white/20 text-white">
      Cancel
    </button>
  </motion.div>
</div>
```

**Critical Rule**: This component MUST NOT unmount until:
- Match found (transition to CONNECTING)
- User clicks "Cancel" (transition to IDLE)
- Error occurs (show error toast)

**Code Location**: [LiveCallContext.tsx:40](file:///home/battulga/Desktop/flint/frontend/src/features/live-call/context/LiveCallContext.tsx#L40)

---

#### State 3: CONNECTING (Match Found)
**Component**: `ConnectingScreen`  
**Trigger**: `MATCH_FOUND` event received  
**Current Implementation**: ✅ Already exists  
**Text**:
- Primary: "Match Found!"
- Secondary: "Connecting to [Partner Name]..."

**Enhancement Needed**:
```tsx
// Current: Generic "Connecting..."
// Proposed: Specific "Match Found!" message
<h3 className="text-2xl font-bold text-white mb-2">
  {isLiveCall ? 'Match Found!' : (isRequester ? 'Calling...' : 'Connecting...')}
</h3>
```

**Code Location**: [ConnectingScreen.tsx:80](file:///home/battulga/Desktop/flint/frontend/src/features/call-system/components/ConnectingScreen.tsx#L80)

---

## 4. Chat Flow - Transparent State Feedback

### State Progression (Caller)

```
IDLE → PRE_FLIGHT → CALLING → CONNECTING → STAGE_ACTIVE
```

### State Progression (Receiver)

```
IDLE → INCOMING → PRE_FLIGHT → CONNECTING → STAGE_ACTIVE
```

### Detailed State Breakdown

#### Caller States

| State | UI Component | Primary Text | Secondary Text | Visual Feedback | Duration |
|-------|-------------|--------------|----------------|-----------------|----------|
| **PRE_FLIGHT** | `DeviceCheckScreen` | "Checking Hardware..." | "Please allow camera and microphone access" | Rotating camera/mic icon | 1-3s |
| **CALLING** | `ConnectingScreen` | "Calling [Name]..." | "Waiting for response..." | Partner avatar + dialing sound | 0-30s |
| **CONNECTING** | `ConnectingScreen` | "Connecting..." | "Connecting to [Name]..." | Partner avatar + pulse | 1-2s |

#### Receiver States

| State | UI Component | Primary Text | Secondary Text | Visual Feedback | Duration |
|-------|-------------|--------------|----------------|-----------------|----------|
| **INCOMING** | `IncomingCallScreen` | "Incoming Call" | "From [Name]" | Partner avatar + ringtone | 0-30s |
| **PRE_FLIGHT** | `DeviceCheckScreen` | "Checking Hardware..." | "Please allow camera and microphone access" | Rotating camera/mic icon | 1-3s |
| **CONNECTING** | `ConnectingScreen` | "Connecting..." | "Connecting to [Name]..." | Partner avatar + pulse | 1-2s |

### Implementation Details

#### Caller: CALLING State
**Component**: `ConnectingScreen`  
**Trigger**: Hardware check passes → `socket.emit(request-call)`  
**Current Implementation**: ✅ Already exists (with `isRequester` prop)  
**Text**:
- Primary: "Calling [Name]..."
- Secondary: "Waiting for response..."

**Code Location**: [ConnectingScreen.tsx:80](file:///home/battulga/Desktop/flint/frontend/src/features/call-system/components/ConnectingScreen.tsx#L80)

---

#### Receiver: INCOMING State
**Component**: `IncomingCallScreen`  
**Trigger**: `request-call` event received  
**Current Implementation**: ✅ Already exists  
**Text**:
- Primary: "Incoming Call"
- Secondary: "From [Name]"

**Critical Flow**:
1. User sees `IncomingCallScreen`
2. User clicks "Accept"
3. FSM transitions to `PRE_FLIGHT` (hardware check)
4. Hardware check passes → FSM transitions to `CONNECTING`
5. Agora connects → FSM transitions to `STAGE_ACTIVE`

---

## 5. Strict Transition Gating

### Rule: No Premature Dismissal

Once a match is found (Live) or accepted (Chat), the UI MUST lock into a "Connecting" state that cannot be dismissed until:
- ✅ Agora channel is fully joined (transition to `STAGE_ACTIVE`)
- ❌ Error occurs (show error toast, transition to `IDLE`)
- ❌ Partner disconnects (show "Connection lost" toast, transition to `IDLE`)

### Implementation Strategy

#### Frontend FSM Guard
```typescript
// In useCallFSM.ts
const fsmReducer = (state: FSMState, event: FSMEvent): FSMState => {
  switch (event.type) {
    case 'AGORA_CONNECTED':
      // ONLY allow transition from CONNECTING
      if (state.state !== 'CONNECTING') return state
      return {
        state: 'STAGE_ACTIVE',
        context: state.context,
        error: undefined
      }
    
    // Prevent premature cleanup
    case 'CLEANUP_COMPLETE':
      // ONLY allow cleanup from FINISHED or IDLE
      if (!['FINISHED', 'IDLE'].includes(state.state)) return state
      return initialState
  }
}
```

#### UI Lock Mechanism
```tsx
// In UnifiedCallInterface.tsx
const handleClose = useCallback(() => {
  // Prevent close during critical states
  if (['CONNECTING', 'STAGE_ACTIVE'].includes(state)) {
    console.warn('[CallInterface] Close blocked - call in progress')
    return
  }
  
  // Safe to close
  endCall()
  reset()
  onClose()
}, [state, endCall, reset, onClose])
```

---

## 6. Performance Optimizations

### Optimistic State Updates

#### Live Call Queue Entry
```typescript
// Current: Wait for server acknowledgment
socket.emit(JOIN_QUEUE)
// ... wait for response ...
setStatus('queueing')

// Proposed: Optimistic update
setStatus('queueing')  // Immediate UI feedback
socket.emit(JOIN_QUEUE)
socket.once('error', () => {
  setStatus('idle')  // Rollback on error
})
```

#### Chat Call Request
```typescript
// Current: Wait for server acknowledgment
socket.emit('request-call', { matchId, calleeId })
// ... wait for response ...
setCalling(context)

// Proposed: Optimistic update
setCalling(context)  // Immediate UI feedback
socket.emit('request-call', { matchId, calleeId })
socket.once('staged-call-error', () => {
  reset()  // Rollback on error
})
```

### Rapid Socket Acknowledgments

**Backend Enhancement**: Add immediate acknowledgment for queue entry
```typescript
// In live-call.handler.ts
socket.on(LIVE_CALL_EVENTS.JOIN_QUEUE, async (data) => {
  // Immediate acknowledgment
  socket.emit(LIVE_CALL_EVENTS.QUEUE_JOINED, { timestamp: Date.now() })
  
  // Then process matching
  await liveCallService.addToQueue(userId, data)
  const match = await liveCallService.findMatch(userId)
  // ...
})
```

**Frontend Response**:
```typescript
socket.on(LIVE_CALL_EVENTS.QUEUE_JOINED, () => {
  setStatus('queueing')  // Confirmed by server
})
```

---

## 7. Implementation Checklist

### Backend (Already Complete ✅)
- [x] Remove `ongoingCalls` Map
- [x] Remove `handleAction()` method
- [x] Remove database imports and writes
- [x] Remove `CALL_ACTION` listener
- [x] Service only handles queue management

### Frontend (Needs Implementation)

#### Live Call Flow
- [ ] Enhance `LiveCallQueueOverlay` with specific state messages
- [ ] Add wait time estimation (after 10s)
- [ ] Prevent premature unmounting of queue UI
- [ ] Add "Match Found!" message to `ConnectingScreen` for live calls
- [ ] Implement optimistic state updates for queue entry

#### Chat Flow
- [ ] Verify `CALLING` state shows "Calling [Name]..." (already exists)
- [ ] Verify `INCOMING` state shows "Incoming Call from [Name]" (already exists)
- [ ] Ensure hardware check happens AFTER accept (already implemented)

#### Transition Gating
- [ ] Add FSM guard to prevent transitions from `CONNECTING` except to `STAGE_ACTIVE` or error states
- [ ] Add UI lock mechanism to prevent close during `CONNECTING` and `STAGE_ACTIVE`
- [ ] Add partner disconnect handling with "Connection lost" toast

#### Performance
- [ ] Implement optimistic state updates for queue entry
- [ ] Implement optimistic state updates for call request
- [ ] Add rapid socket acknowledgments for queue entry (backend)

---

## 8. Testing Scenarios

### Live Call Flow
1. **Happy Path**: Click "Start Live Call" → Hardware check → Queue → Match found → Connecting → Active call
2. **Hardware Denied**: Click "Start Live Call" → Hardware check fails → Show error + retry
3. **Long Wait**: Queue for 30s+ → Show "Still searching..." message
4. **Cancel While Queueing**: Click "Cancel" → Return to idle
5. **Match During Cancel**: Match found while clicking cancel → Lock into connecting state

### Chat Flow
1. **Happy Path (Caller)**: Click "Call" → Hardware check → Calling → Partner accepts → Connecting → Active call
2. **Happy Path (Receiver)**: Receive call → Click accept → Hardware check → Connecting → Active call
3. **Declined**: Caller sends request → Receiver declines → Show "Call declined" toast
4. **Timeout**: Caller sends request → No response for 30s → Show "No answer" toast
5. **Partner Busy**: Caller sends request → Partner is busy → Show "User is busy" toast immediately

---

## 9. Visual Design Specifications

### Color Palette
- **Primary (Brand)**: `bg-brand`, `text-brand` (used for active states)
- **Success**: `bg-green-500/20`, `text-green-500` (hardware ready)
- **Error**: `bg-destructive/20`, `text-destructive` (permission denied)
- **Neutral**: `text-white/60` (secondary text)

### Animation Timing
- **Fast**: 200ms (button hover, state transitions)
- **Medium**: 500ms (component mount/unmount)
- **Slow**: 2s (breathing animations, search ripples)

### Typography
- **Primary Heading**: `text-2xl font-bold` (state title)
- **Secondary Text**: `text-base text-white/60` (state description)
- **Tertiary Text**: `text-sm text-white/40` (wait time, hints)

---

## Summary

This UX State Plan provides **granular, transparent feedback** for every step of the pre-call sequence:

✅ **Backend**: Fully cleaned up (ephemeral service only)  
✅ **Live Call**: 4 distinct states with specific messages  
✅ **Chat Call**: 3 distinct states per role (caller/receiver)  
✅ **Gating**: Strict transition rules prevent premature dismissal  
✅ **Performance**: Optimistic updates + rapid acknowledgments  

**Next Steps**: Implement frontend enhancements per checklist above.
