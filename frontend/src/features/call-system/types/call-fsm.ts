// =============================================================================
// Call FSM Types
// =============================================================================

/**
 * Possible states in the call finite state machine
 */
export type CallState =
    | 'IDLE'
    | 'PRE_FLIGHT'
    | 'CHECK_DEVICES'
    | 'CONNECTING'
    | 'STAGE_ACTIVE'
    | 'INTERMISSION'
    | 'FINISHED'

/**
 * Type of call being orchestrated
 */
export type CallType = 'live' | 'staged'

/**
 * Partner information for the call
 */
export interface PartnerInfo {
    id: string
    name: string
    avatar?: string
}

/**
 * Result of hardware device check
 */
export interface DeviceCheckResult {
    ready: boolean
    error?: string
    hasAudio: boolean
    hasVideo: boolean
}

/**
 * Shared context data across all call states
 */
export interface CallContext {
    callType: CallType
    matchId: string
    channelName: string
    partnerInfo: PartnerInfo
    currentStage?: 1 | 2 | 3
    deviceCheck?: DeviceCheckResult
    startTime?: number
    duration?: number
}

/**
 * Events that trigger FSM state transitions
 */
export type FSMEvent =
    | { type: 'START_PREFLIGHT'; payload: { requireVideo: boolean; onReady: () => void } }
    | { type: 'PREFLIGHT_COMPLETED' }
    | { type: 'START_CALL'; payload: Omit<CallContext, 'deviceCheck' | 'startTime' | 'duration'> }
    | { type: 'DEVICES_APPROVED'; payload: DeviceCheckResult }
    | { type: 'DEVICES_DENIED'; payload: { error: string } }
    | { type: 'AGORA_CONNECTED' }
    | { type: 'STAGE_ENDED' }
    | { type: 'NEXT_STAGE_ACCEPTED' }
    | { type: 'NEXT_STAGE_DECLINED' }
    | { type: 'CALL_ENDED' }
    | { type: 'CLEANUP_COMPLETE' }
    | { type: 'ERROR'; payload: { error: string } }

/**
 * FSM State with context
 */
export interface FSMState {
    state: CallState
    context: CallContext | null
    preflight?: {
        requireVideo: boolean
        onReady: () => void
    }
    error?: string
}

/**
 * Actions exposed by useCallFSM hook
 */
export interface CallFSMActions {
    startPreflight: (options: { requireVideo: boolean; onReady: () => void }) => void
    startCall: (context: Omit<CallContext, 'deviceCheck' | 'startTime' | 'duration'>) => void
    handleDeviceCheck: (result: DeviceCheckResult) => void
    handleAgoraConnected: () => void
    handleStageEnded: () => void
    handleNextStageResponse: (accepted: boolean) => void
    endCall: () => void
    reset: () => void
}

/**
 * Return type of useCallFSM hook
 */
export interface UseCallFSMReturn extends CallFSMActions {
    state: CallState
    context: CallContext | null
    preflight?: {
        requireVideo: boolean
        onReady: () => void
    }
    error?: string
    isActive: boolean
}
