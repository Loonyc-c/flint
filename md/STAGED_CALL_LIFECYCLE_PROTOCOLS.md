# Staged Call Lifecycle Protocols - Zero-Tolerance Rules

> [!CAUTION]
> **CRITICAL SYSTEM SPECIFICATION**  
> These rules are **mandatory** for all Staged Call implementations. Violations will result in stuck busy states, ghost calls, and poor user experience. Treat these as compile-time constraints.

---

## 1. STRICT ENTRY PROTOCOLS (Pre-Connection Gates)

### 1.1 Universal Prerequisites

#### Client-Side Hardware Gate

- [ ] **Rule**: `useHardwareGate` MUST return `ready: true` before ANY network request
- [ ] **Scope**: Applies to ALL call initiation paths:
  - Live Call: `JOIN_QUEUE` event
  - Swipe/Chat: `request-call` event
  - Incoming Call: `accept-call` event
- [ ] **Implementation**: Check `result.ready === true` AND `result.hasAudio === true` (minimum)
- [ ] **Failure Strategy**: "Fail Fast" - Block action immediately, show UI error toast
- [ ] **Error Messages**:
  - `no_mic`: "Microphone not found"
  - `no_camera`: "Camera not found" (for video stages)
  - `permission_denied`: "Please allow camera/microphone access"
  - `already_in_use`: "Camera/microphone is being used by another app"

#### Server-Side Busy State Gate

- [ ] **Rule**: `busyStateService.isUserBusy(userId)` MUST return `false` before accepting call requests
- [ ] **Scope**: Applies to ALL socket event handlers:
  - `request-call` (caller AND callee validation)
  - `accept-call` (callee validation)
  - `live-call-join` (queue entry validation)
- [ ] **Implementation**: Use `busyStateService.canUserStartCall(userId)` helper
- [ ] **Failure Strategy**: Reject with specific error code
- [ ] **Error Codes**:
  - `409 Conflict`: User is already busy
  - Error message format: `"User is ${status}"` (e.g., "User is queueing", "User is in-call")

---

### 1.2 Flow-Specific Entry Rules

#### Live Call Flow (Queue-Based Matching)

- [ ] **Queueing State**:
  - User enters `queueing` state ONLY after successful `addToQueue()`
  - UI displays "Finding Match" overlay
  - User remains in queue indefinitely until match found OR user cancels
- [ ] **Matching Logic**:
  - Match occurs ONLY when `liveCallService.isCompatible()` returns `true` for BOTH directions
  - Compatibility checks:
    - [ ] Gender: `userA.preferences.lookingFor` matches `userB.gender` (bidirectional)
    - [ ] Age: `userA.age` is within `userB.preferences.ageRange` (bidirectional)
  - Partner availability: `busyStateService.getUserStatus(partnerId) === 'queueing'`
- [ ] **Connection Trigger**:
  - Do NOT emit `MATCH_FOUND` until BOTH users are confirmed available
  - Set both users to `in-call` status BEFORE emitting match event
  - Generate Agora credentials for BOTH users simultaneously

#### Swipe/Chat Flow (Direct Request)

- [ ] **Initiator (Caller) Rules**:
  - CANNOT send `request-call` if `busyStateService.isUserBusy(callerId) === true`
  - MUST pass hardware gate before sending request
  - Frontend: Use `useCallGuard.canInitiateCall(partnerId)` before emitting
- [ ] **Receiver (Callee) Rules**:
  - CANNOT accept `request-call` without passing hardware gate first (Symmetrical Check)
  - CANNOT accept if `busyStateService.isUserBusy(calleeId) === true`
  - UI: Show "Accept" button ONLY after hardware gate passes
- [ ] **Rejection Scenarios**:
  - If callee is busy when request arrives: Emit `staged-call-error` to caller immediately
  - If callee declines: Emit `staged-call-declined` to caller
  - If callee doesn't respond within 30s: Emit `staged-call-timeout` to caller

---

## 2. STRICT EXIT PROTOCOLS (Disconnection & Cleanup)

### 2.1 Scenario A: Explicit Termination (User Action)

#### Trigger
- [ ] User clicks "End Call" button in `ActiveCallContainer`
- [ ] User clicks "Decline" on incoming call screen
- [ ] User clicks "Cancel" while waiting for acceptance

#### Frontend Actions
- [ ] Call `handleEndCall()` which invokes `leave()` (Agora cleanup)
- [ ] Emit `staged-call-end` event with `{ matchId }`
- [ ] Transition FSM to `FINISHED` state
- [ ] Show `CallEndedScreen` for 5 seconds
- [ ] Reset FSM to `IDLE` state

#### Backend Actions
- [ ] Receive `staged-call-end` event
- [ ] Call `stagedCallLogic.clearCall(matchId)`:
  - [ ] Clear all timers (`ringTimeoutId`, `timerId`, `icebreakerTimerId`)
  - [ ] Call `busyStateService.clearUserStatus(callerId)`
  - [ ] Call `busyStateService.clearUserStatus(calleeId)`
  - [ ] Remove call from `activeStagedCalls` map
  - [ ] Call `stagedCallService.endStagedCall(matchId)`
- [ ] Emit `staged-call-ended` to partner with reason `ended_by_user`

---

### 2.2 Scenario B: Implicit Termination (System Event)

#### Trigger: Browser Tab Close / Refresh
- [ ] `beforeunload` event fires in `ActiveCallContainer`
- [ ] **CRITICAL**: Use synchronous socket emit (no `await`)
- [ ] Emit `staged-call-end` event with `{ matchId }`
- [ ] Socket disconnects (may happen before emit completes)

#### Trigger: Navigation / Route Change
- [ ] Component unmounts (`useEffect` cleanup in `ActiveCallContainer`)
- [ ] Emit `staged-call-end` event with `{ matchId }`
- [ ] Call `leave()` to stop Agora tracks
- [ ] Socket remains connected (user still on site)

#### Trigger: Network Drop / Connection Loss
- [ ] Socket disconnects without explicit emit
- [ ] Backend `disconnect` handler is the ONLY safety net

#### Backend Disconnect Handler (Ultimate Safety Net)
- [ ] **Rule**: `socket.on('disconnect')` MUST handle cleanup for ALL active calls
- [ ] **Implementation**:
  ```typescript
  socket.on('disconnect', () => {
    // 1. Iterate through all active calls
    for (const [matchId, call] of activeStagedCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        // 2. Clear the call (timers + busy states)
        stagedCallLogic.clearCall(matchId)
        
        // 3. Notify partner
        const otherId = call.callerId === userId ? call.calleeId : call.callerId
        io.to(`user:${otherId}`).emit('staged-call-ended', {
          matchId,
          stage: call.stage,
          reason: 'disconnect'
        })
      }
    }
    
    // 4. Safety net: Force clear busy state
    const userStatus = busyStateService.getUserStatus(userId)
    if (userStatus !== 'available') {
      busyStateService.clearUserStatus(userId)
    }
  })
  ```
- [ ] **Logging**: MUST log all cleanup actions for debugging
- [ ] **Partner Notification**: MUST emit `staged-call-ended` with `reason: 'disconnect'`

---

### 2.3 State Reset Rule

#### Frontend State Reset
- [ ] FSM transitions to `IDLE` state
- [ ] All call context cleared (`context = null`)
- [ ] Hardware gate result cleared
- [ ] Agora tracks stopped and released
- [ ] UI returns to default view (chat/swipe screen)

#### Backend State Reset
- [ ] User status set to `available` via `busyStateService.clearUserStatus(userId)`
- [ ] Call removed from `activeStagedCalls` map
- [ ] All timers cleared (ring timeout, stage timer, icebreaker timer)
- [ ] Database record updated with `endTime` (if applicable)

---

## 3. BUSY STATE LIFECYCLE

### State Transitions

```
available → queueing → in-call → available
available → connecting → in-call → available
```

### State Definitions

| State | Description | Can Receive Calls? | Can Initiate Calls? |
|-------|-------------|-------------------|---------------------|
| `available` | User is idle, not in any call or queue | ✅ Yes | ✅ Yes |
| `queueing` | User is in live call queue | ❌ No | ❌ No |
| `connecting` | User is in call setup (ringing/accepting) | ❌ No | ❌ No |
| `in-call` | User is in active call | ❌ No | ❌ No |

### Validation Checklist

- [ ] **Entry Validation**: Check `busyStateService.canUserStartCall(userId)` before EVERY call action
- [ ] **State Transition**: Set status IMMEDIATELY when action is accepted (not after Agora connects)
- [ ] **Exit Cleanup**: ALWAYS clear status on disconnect, regardless of current state
- [ ] **Safety Net**: Disconnect handler MUST clear status even if no active call found

---

## 4. IMPLEMENTATION VERIFICATION CHECKLIST

### Frontend Checklist

- [ ] `useHardwareGate` is called before ALL call initiation paths
- [ ] `useCallGuard` combines hardware + busy state checks
- [ ] `ActiveCallContainer` has `beforeunload` listener with synchronous emit
- [ ] `ActiveCallContainer` has `useEffect` cleanup with socket emit
- [ ] FSM properly transitions through all states (IDLE → CHECK_DEVICES → CONNECTING → STAGE_ACTIVE → FINISHED → IDLE)
- [ ] Error toasts shown for all rejection scenarios

### Backend Checklist

- [ ] `request-call` handler validates BOTH caller and callee busy states
- [ ] `accept-call` handler validates callee busy state
- [ ] `live-call-join` handler validates user busy state
- [ ] `disconnect` handler iterates through ALL active calls
- [ ] `disconnect` handler has safety net to force clear busy state
- [ ] All handlers use `busyStateService.canUserStartCall()` helper
- [ ] All cleanup paths call `stagedCallLogic.clearCall()`

### Testing Checklist

- [ ] Test: User A tries to join queue while already in queue → Rejected
- [ ] Test: User A tries to accept call while in another call → Rejected
- [ ] Test: User A closes browser during call → User B receives disconnect event
- [ ] Test: User A navigates away during call → User B receives disconnect event
- [ ] Test: User A's network drops during call → User B receives disconnect event after timeout
- [ ] Test: Both users' busy states cleared after ANY termination scenario

---

## 5. ERROR HANDLING MATRIX

| Scenario | Error Type | Frontend Action | Backend Action |
|----------|-----------|-----------------|----------------|
| Hardware denied | `permission_denied` | Show error toast, block action | N/A |
| User already busy | `user_busy` | Show "User is busy" toast | Emit `staged-call-error` |
| Partner busy | `partner_busy` | Show "User is busy" toast | Emit `staged-call-error` |
| Call timeout (30s) | `timeout` | Show "No answer" toast, reset FSM | Emit `staged-call-timeout` |
| Network disconnect | `disconnect` | Show "Connection lost" toast | Emit `staged-call-ended` to partner |
| Explicit decline | `declined` | Show "Call declined" toast | Emit `staged-call-declined` |

---

## 6. LOGGING REQUIREMENTS

### Frontend Logging
- [ ] Log hardware gate results: `[HardwareGate] Ready: ${result.ready}, Audio: ${result.hasAudio}, Video: ${result.hasVideo}`
- [ ] Log FSM transitions: `[CallFSM] ${oldState} → ${newState}`
- [ ] Log cleanup triggers: `[ActiveCall] Emitted staged-call-end due to ${reason}`

### Backend Logging
- [ ] Log entry gate rejections: `[StagedCall] Request blocked - ${reason}`
- [ ] Log disconnect cleanup: `[StagedCall] User ${userId} disconnected, checking for active calls...`
- [ ] Log partner notifications: `[StagedCall] Notified partner ${partnerId} of disconnect`
- [ ] Log safety net triggers: `[StagedCall] Force clearing busy state for ${userId} (was ${status})`

---

## 7. PERFORMANCE CONSIDERATIONS

- [ ] **Synchronous Cleanup**: All `beforeunload` emissions MUST be synchronous (no `await`)
- [ ] **Timeout Values**:
  - Ring timeout: 30 seconds (`STAGED_CALL_CONSTANTS.RING_TIMEOUT`)
  - Stage duration: 90 seconds (configurable per stage)
  - Reconnection timeout: 10 seconds (Socket.io default)
- [ ] **Memory Management**: Clear all timers and references in cleanup functions
- [ ] **Socket Efficiency**: Use room-based emissions (`io.to(user:${userId})`) instead of broadcasting

---

## COMPLIANCE STATEMENT

> [!IMPORTANT]
> **Developer Attestation**  
> By implementing a Staged Call feature, you attest that:
> 1. All entry gates are enforced (hardware + busy state)
> 2. All exit paths trigger cleanup (explicit + implicit)
> 3. The disconnect handler is the ultimate safety net
> 4. No user can be stuck in a busy state after call termination
> 
> **Failure to comply with these protocols will result in production incidents.**

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-18  
**Maintained By**: System Architecture Team
