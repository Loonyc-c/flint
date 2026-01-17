'use client'

import { useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCallFSM } from '../hooks/useCallFSM'
import { DeviceCheckScreen } from './DeviceCheckScreen'
import { IncomingCallScreen } from './IncomingCallScreen'
import { ConnectingScreen } from './ConnectingScreen'
import { ActiveCallContainer, type AgoraControls } from './ActiveCallContainer'
import { IntermissionOverlay } from './IntermissionOverlay'
import { CallEndedScreen } from './CallEndedScreen'
import type { CallType, PartnerInfo } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface UnifiedCallInterfaceProps {
    isOpen: boolean
    callType: CallType
    matchId: string
    channelName: string
    partnerInfo: PartnerInfo
    currentStage?: 1 | 2 | 3
    remainingTime?: number
    isIncoming?: boolean
    action?: 'accept' | 'decline' | 'start'
    onHangup?: () => void
    onAcceptReady?: () => void
    onDecline?: () => void
    onClose: () => void
}

// =============================================================================
// Component
// =============================================================================

export const UnifiedCallInterface = ({
    isOpen,
    callType,
    matchId,
    channelName,
    partnerInfo,
    currentStage = 1,
    remainingTime = 0,
    isIncoming: isIncomingProp = false,
    action,
    preflight,
    onHangup,
    onAcceptReady,
    onDecline,
    onClose
}: UnifiedCallInterfaceProps & { preflight?: { requireVideo: boolean, onReady: () => void, onCancel: () => void } }) => {
    const {
        state,
        context,
        preflight: fsm_preflight,
        handleDeviceCheck,
        handleAgoraConnected,
        handleStageEnded,
        handleNextStageResponse,
        endCall,
        acceptCall: fsm_acceptCall,
        declineCall: fsm_declineCall,
        setCalling,
        setIncoming,
        reset,
        startCall,
        startPreflight
    } = useCallFSM()

    // Store Agora controls for mute/unmute during intermission
    const agoraControlsRef = useRef<AgoraControls | null>(null)



    // Track if we are in the process of starting a call to prevent race condition with auto-close
    const isStartingRef = useRef(false)

    // Start call or preflight when opened
    useEffect(() => {
        if (!isOpen || state !== 'IDLE') return

        if (preflight) {
            isStartingRef.current = true
            startPreflight({
                requireVideo: preflight.requireVideo,
                onReady: preflight.onReady
            })
        } else if (matchId && channelName && partnerInfo) {
            isStartingRef.current = true
            const callData = { callType, matchId, channelName, partnerInfo, currentStage, remainingTime, onHangup }
            if (isIncomingProp) {
                setIncoming(callData)
            } else {
                setCalling(callData)
            }
        }
    }, [isOpen, state, callType, matchId, channelName, partnerInfo, currentStage, remainingTime, preflight, isIncomingProp, setCalling, setIncoming, startCall, startPreflight, onHangup])

    // Handle incoming actions from provider signals
    useEffect(() => {
        if (state === 'INCOMING' || state === 'CALLING') {
            // Reset starting flag as we are now active
            isStartingRef.current = false

            if (action === 'accept') fsm_acceptCall()
            else if (action === 'decline') fsm_declineCall()
            else if (action === 'start') {
                startCall({ callType, matchId, channelName, partnerInfo, currentStage, remainingTime, onHangup })
            }
        }
    }, [state, action, fsm_acceptCall, fsm_declineCall, startCall, callType, matchId, channelName, partnerInfo, currentStage, remainingTime, onHangup])

    // Handle close
    const handleClose = useCallback((wasSuccess = false) => {
        if (state === 'PRE_FLIGHT' && preflight && !wasSuccess) {
            preflight.onCancel()
        }
        if ((state === 'INCOMING' || state === 'CALLING') && isIncomingProp && onDecline && !wasSuccess) {
            onDecline()
        }
        if (onHangup && !wasSuccess) {
            onHangup()
        }
        endCall()
        reset()
        onClose()
    }, [state, preflight, onHangup, isIncomingProp, onDecline, endCall, reset, onClose])

    // Handle cleanup when finished
    useEffect(() => {
        if (state === 'FINISHED') {
            const timer = setTimeout(() => {
                reset()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [state, reset])

    // Effect to close the interface if the FSM resets to IDLE (e.g. on timeout)
    useEffect(() => {
        // Prevent closing if we are currently starting up (race condition fix)
        if (isStartingRef.current) return

        if (state === 'IDLE' && isOpen && !preflight) {
            onClose()
        }
    }, [state, isOpen, preflight, onClose])

    // Render if:
    // 1. isOpen is true AND
    // 2. Either we have context (call data) OR we're in PRE_FLIGHT mode (hardware check)
    if (!isOpen) return null
    if (!context && state !== 'PRE_FLIGHT') return null

    return (
        <AnimatePresence mode="wait">
            {(state === 'CHECK_DEVICES' || state === 'PRE_FLIGHT') && (
                <DeviceCheckScreen
                    requireVideo={
                        state === 'PRE_FLIGHT'
                            ? fsm_preflight?.requireVideo || false
                            : (context?.callType === 'staged' && (context?.currentStage || 1) >= 2)
                    }
                    requireAudio={true}
                    onResult={(result) => {

                        if (state === 'PRE_FLIGHT') {
                            if (result.ready) {

                                fsm_preflight?.onReady()
                                handleClose(true)
                            }
                        } else {
                            if (result.ready && state === 'CHECK_DEVICES' && isIncomingProp && onAcceptReady) {
                                onAcceptReady()
                            }
                            handleDeviceCheck(result)
                        }
                    }}
                    onCancel={() => handleClose(false)}
                />
            )}

            {/* Calling/Incoming Screen */}
            {(state === 'CALLING' || state === 'INCOMING') && context && (
                context.isIncoming ? (
                    <IncomingCallScreen
                        partnerInfo={context.partnerInfo}
                        onAccept={fsm_acceptCall}
                        onDecline={handleClose}
                    />
                ) : (
                    <ConnectingScreen
                        partnerInfo={context.partnerInfo}
                        isRequester={true}
                        onTimeout={handleClose}
                    />
                )
            )}

            {(state === 'CONNECTING' || state === 'STAGE_ACTIVE') && context && (
                <>
                    <ActiveCallContainer
                        context={context}
                        remainingTime={remainingTime}
                        onConnected={handleAgoraConnected}
                        onStageEnded={handleStageEnded}
                        onCallEnded={handleClose}
                        onAgoraReady={(controls) => {
                            agoraControlsRef.current = controls
                        }}
                    />

                    {state === 'CONNECTING' && (
                        <ConnectingScreen
                            partnerInfo={context.partnerInfo}
                            isRequester={false}
                            onTimeout={handleClose}
                        />
                    )}
                </>
            )}

            {state === 'INTERMISSION' && context && (
                <IntermissionOverlay
                    context={context}
                    onResponse={handleNextStageResponse}
                    muteStreams={() => agoraControlsRef.current?.muteAll()}
                    unmuteStreams={() => agoraControlsRef.current?.unmuteAll()}
                />
            )}

            {state === 'FINISHED' && context && (
                <CallEndedScreen
                    context={context}
                    wasSuccessful={callType === 'live'}
                    autoCloseMs={5000}
                    onClose={handleClose}
                />
            )}
        </AnimatePresence>
    )
}
