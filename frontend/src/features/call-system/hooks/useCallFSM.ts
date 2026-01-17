'use client'

import { useReducer, useCallback, useMemo } from 'react'
import type {
    CallState,
    FSMState,
    FSMEvent,
    CallContext,
    DeviceCheckResult,
    UseCallFSMReturn
} from '../types/call-fsm'

// =============================================================================
// Initial State
// =============================================================================

const initialState: FSMState = {
    state: 'IDLE',
    context: null,
    error: undefined
}

// =============================================================================
// Reducer
// =============================================================================

const fsmReducer = (state: FSMState, event: FSMEvent): FSMState => {
    switch (event.type) {
        case 'START_PREFLIGHT':
            if (state.state !== 'IDLE') return state
            return {
                state: 'PRE_FLIGHT',
                context: null,
                preflight: {
                    requireVideo: event.payload.requireVideo,
                    onReady: event.payload.onReady
                },
                error: undefined
            }

        case 'PREFLIGHT_COMPLETED':
            return initialState

        case 'START_CALL':
            if (state.state !== 'IDLE') return state
            return {
                state: 'CHECK_DEVICES',
                context: {
                    ...event.payload,
                    startTime: Date.now()
                },
                error: undefined
            }

        case 'DEVICES_APPROVED':
            if (state.state !== 'CHECK_DEVICES' || !state.context) return state
            return {
                state: 'CONNECTING',
                context: {
                    ...state.context,
                    deviceCheck: event.payload
                },
                error: undefined
            }

        case 'DEVICES_DENIED':
            if (state.state !== 'CHECK_DEVICES') return state
            return {
                state: 'IDLE',
                context: null,
                error: event.payload.error
            }

        case 'AGORA_CONNECTED':
            if (state.state !== 'CONNECTING') return state
            return {
                state: 'STAGE_ACTIVE',
                context: state.context,
                error: undefined
            }

        case 'STAGE_ENDED':
            if (state.state !== 'STAGE_ACTIVE' || !state.context) return state
            // Only transition to INTERMISSION for staged calls
            if (state.context.callType === 'staged') {
                return {
                    state: 'INTERMISSION',
                    context: state.context,
                    error: undefined
                }
            }
            // Live calls go directly to FINISHED
            return {
                state: 'FINISHED',
                context: state.context,
                error: undefined
            }

        case 'NEXT_STAGE_ACCEPTED':
            if (state.state !== 'INTERMISSION' || !state.context) return state
            return {
                state: 'STAGE_ACTIVE',
                context: {
                    ...state.context,
                    currentStage: ((state.context.currentStage || 1) + 1) as 1 | 2 | 3,
                    startTime: Date.now() // Reset timer for new stage
                },
                error: undefined
            }

        case 'NEXT_STAGE_DECLINED':
            if (state.state !== 'INTERMISSION') return state
            return {
                state: 'FINISHED',
                context: state.context,
                error: undefined
            }

        case 'CALL_ENDED':
            if (!['STAGE_ACTIVE', 'INTERMISSION'].includes(state.state)) return state
            return {
                state: 'FINISHED',
                context: state.context ? {
                    ...state.context,
                    duration: state.context.startTime ? Date.now() - state.context.startTime : undefined
                } : null,
                error: undefined
            }

        case 'CLEANUP_COMPLETE':
            return initialState

        case 'ERROR':
            return {
                state: 'IDLE',
                context: null,
                error: event.payload.error
            }

        default:
            return state
    }
}

// =============================================================================
// Hook
// =============================================================================

export const useCallFSM = (): UseCallFSMReturn => {
    const [fsmState, dispatch] = useReducer(fsmReducer, initialState)

    const startPreflight = useCallback((options: { requireVideo: boolean; onReady: () => void }) => {
        dispatch({ type: 'START_PREFLIGHT', payload: options })
    }, [])

    const startCall = useCallback((context: Omit<CallContext, 'deviceCheck' | 'startTime' | 'duration'>) => {
        dispatch({ type: 'START_CALL', payload: context })
    }, [])

    const handleDeviceCheck = useCallback((result: DeviceCheckResult) => {
        if (result.ready) {
            dispatch({ type: 'DEVICES_APPROVED', payload: result })
        } else {
            dispatch({ type: 'DEVICES_DENIED', payload: { error: result.error || 'Device check failed' } })
        }
    }, [])

    const handleAgoraConnected = useCallback(() => {
        dispatch({ type: 'AGORA_CONNECTED' })
    }, [])

    const handleStageEnded = useCallback(() => {
        dispatch({ type: 'STAGE_ENDED' })
    }, [])

    const handleNextStageResponse = useCallback((accepted: boolean) => {
        if (accepted) {
            dispatch({ type: 'NEXT_STAGE_ACCEPTED' })
        } else {
            dispatch({ type: 'NEXT_STAGE_DECLINED' })
        }
    }, [])

    const endCall = useCallback(() => {
        dispatch({ type: 'CALL_ENDED' })
    }, [])

    const reset = useCallback(() => {
        dispatch({ type: 'CLEANUP_COMPLETE' })
    }, [])

    const isActive = useMemo(() => {
        return ['PRE_FLIGHT', 'CHECK_DEVICES', 'CONNECTING', 'STAGE_ACTIVE', 'INTERMISSION'].includes(fsmState.state)
    }, [fsmState.state])

    return {
        state: fsmState.state,
        context: fsmState.context,
        preflight: fsmState.preflight,
        error: fsmState.error,
        isActive,
        startCall,
        handleDeviceCheck,
        handleAgoraConnected,
        handleStageEnded,
        handleNextStageResponse,
        endCall,
        reset,
        startPreflight
    }
}
