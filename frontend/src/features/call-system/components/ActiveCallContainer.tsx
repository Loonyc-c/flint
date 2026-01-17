'use client'

import { useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAgora } from '@/features/video/hooks/useAgora'
import { VideoGrid } from '@/features/video/components/VideoGrid'
import { CallControls } from '@/features/video/components/CallControls'
import { CallHeader } from '@/features/video/components/modal/CallHeader'
import { useGlobalSocket } from '@/features/realtime'
import type { CallContext } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

export interface AgoraControls {
    muteAll: () => Promise<void>
    unmuteAll: (audio?: boolean, video?: boolean) => Promise<void>
}

interface ActiveCallContainerProps {
    context: CallContext
    remainingTime?: number
    onConnected: () => void
    onStageEnded?: () => void
    onCallEnded: () => void
    onAgoraReady?: (controls: AgoraControls) => void
}

// =============================================================================
// Component
// =============================================================================

export const ActiveCallContainer = ({
    context,
    remainingTime = 0,
    onConnected,
    onStageEnded,
    onCallEnded,
    onAgoraReady
}: ActiveCallContainerProps) => {
    const t = useTranslations('call.active')
    const { socket } = useGlobalSocket()

    const {
        isConnected,
        isConnecting,
        localVideoTrack,
        remoteVideoTracks,
        isMicEnabled,
        isCameraEnabled,
        join,
        leave,
        toggleMic,
        toggleCamera,
        muteAll,
        unmuteAll,
        error
    } = useAgora({
        channelName: context.channelName,
        enableVideo: context.callType === 'staged' && (context.currentStage === 2 || context.currentStage === 3)
    })

    // Auto-join on mount
    useEffect(() => {
        if (!isConnected && !isConnecting) {
            join()
        }
    }, [isConnected, isConnecting, join])

    // Notify parent when connected and expose Agora controls
    useEffect(() => {
        if (isConnected) {
            onConnected()
            onAgoraReady?.({ muteAll, unmuteAll })
        }
    }, [isConnected, onConnected, onAgoraReady, muteAll, unmuteAll])

    // Listen for stage-ended event (for staged calls)
    useEffect(() => {
        if (!socket || context.callType !== 'staged') return

        const handleStageEnded = () => {
            onStageEnded?.()
        }

        socket.on('stage-ended', handleStageEnded)
        return () => {
            socket.off('stage-ended', handleStageEnded)
        }
    }, [socket, context.callType, onStageEnded])

    // Handle end call
    const handleEndCall = useCallback(async () => {
        await leave()
        onCallEnded()
    }, [leave, onCallEnded])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isConnected) {
                leave()
            }
        }
    }, [isConnected, leave])

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            {isConnected && (
                <CallHeader
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    remainingTime={remainingTime}
                    stage={context.currentStage || 1}
                    remoteUserName={context.partnerInfo.name}
                    onClose={handleEndCall}
                />
            )}

            {/* Video Grid */}
            <div className="h-full pt-16 pb-32 flex flex-col">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <h3 className="text-white text-xl font-bold mb-2">{t('errorTitle')}</h3>
                        <p className="text-white/60 mb-6">{error}</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => join()}
                            className="px-6 py-3 bg-brand rounded-full text-white font-bold"
                        >
                            {t('retry')}
                        </motion.button>
                    </div>
                ) : (
                    <VideoGrid
                        localVideoTrack={localVideoTrack}
                        remoteVideoTracks={remoteVideoTracks}
                        localUserName={t('you')}
                        remoteUserName={context.partnerInfo.name}
                        isCameraEnabled={isCameraEnabled}
                    />
                )}
            </div>

            {/* Controls */}
            {isConnected && (
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent">
                    <CallControls
                        isMicEnabled={isMicEnabled}
                        isCameraEnabled={isCameraEnabled}
                        onToggleMic={toggleMic}
                        onToggleCamera={toggleCamera}
                        onEndCall={handleEndCall}
                        className="pb-8"
                    />
                </div>
            )}
        </div>
    )
}
