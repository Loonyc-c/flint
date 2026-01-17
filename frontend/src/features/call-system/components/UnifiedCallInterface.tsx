'use client'

import { useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCallFSM } from '../hooks/useCallFSM'
import { DeviceCheckScreen } from './DeviceCheckScreen'
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
    preflight,
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
        reset,
        startCall,
        startPreflight
    } = useCallFSM()

    // Store Agora controls for mute/unmute during intermission
    const agoraControlsRef = useRef<AgoraControls | null>(null)

    // Start call or preflight when opened
    useEffect(() => {
        if (!isOpen || state !== 'IDLE') return

        if (preflight) {
            startPreflight({
                requireVideo: preflight.requireVideo,
                onReady: preflight.onReady
            })
        } else if (matchId && channelName && partnerInfo) {
            startCall({
                callType,
                matchId,
                channelName,
                partnerInfo,
                currentStage
            })
        }
    }, [isOpen, state, callType, matchId, channelName, partnerInfo, currentStage, preflight, startCall, startPreflight])

    // Handle close
    const handleClose = useCallback(() => {
        if (state === 'PRE_FLIGHT' && preflight) {
            preflight.onCancel()
        }
        endCall()
        reset()
        onClose()
    }, [state, preflight, endCall, reset, onClose])

    // Handle cleanup when finished
    useEffect(() => {
        if (state === 'FINISHED') {
            const timer = setTimeout(() => {
                reset()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [state, reset])

    if (!isOpen || (!context && state !== 'PRE_FLIGHT')) return null

    return (
        <AnimatePresence mode="wait">
            {(state === 'CHECK_DEVICES' || state === 'PRE_FLIGHT') && (
                <DeviceCheckScreen
                    requireVideo={
                        state === 'PRE_FLIGHT'
                            ? fsm_preflight?.requireVideo || false
                            : (callType === 'staged' && currentStage >= 2)
                    }
                    requireAudio={true}
                    onResult={(result) => {
                        if (state === 'PRE_FLIGHT') {
                            if (result.ready) {
                                fsm_preflight?.onReady()
                                handleClose()
                            }
                        } else {
                            handleDeviceCheck(result)
                        }
                    }}
                    onCancel={handleClose}
                />
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
