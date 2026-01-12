'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAgora } from '../hooks/useAgora'
import { CallControls } from './CallControls'
import { VideoGrid } from './VideoGrid'
import { CallHeader } from './modal/CallHeader'
import { ConnectingOverlay } from './modal/ConnectingOverlay'
import { useTranslations } from 'next-intl'

// =============================================================================
// Types
// =============================================================================

interface VideoCallModalProps {
  isOpen: boolean
  channelName: string
  localUserName?: string
  remoteUserName?: string
  remainingTime?: number
  stage?: number
  onClose: () => void
  onCallEnded?: () => void
}

// =============================================================================
// Component
// =============================================================================

export const VideoCallModal = ({
  isOpen,
  channelName,
  localUserName,
  remoteUserName,
  remainingTime = 0,
  stage = 2,
  onClose,
  onCallEnded,
}: VideoCallModalProps) => {
  const t = useTranslations('video.modal')
  const finalLocalUserName = localUserName || t('you')
  const finalRemoteUserName = remoteUserName || t('partner')

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
    error,
  } = useAgora({
    channelName,
    enableVideo: true,
  })

  // Auto-join when modal opens
  useEffect(() => {
    if (isOpen && channelName && !isConnected && !isConnecting) {
      join()
    }
  }, [isOpen, channelName, isConnected, isConnecting, join])

  // Handle end call
  const handleEndCall = useCallback(async () => {
    await leave()
    onCallEnded?.()
    onClose()
  }, [leave, onCallEnded, onClose])

  // Handle close
  const handleClose = useCallback(async () => {
    if (isConnected) {
      await leave()
    }
    onClose()
  }, [isConnected, leave, onClose])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        leave()
      }
    }
  }, [isConnected, leave])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black"
        >
          <CallHeader
            isConnected={isConnected}
            isConnecting={isConnecting}
            remainingTime={remainingTime}
            stage={stage}
            remoteUserName={finalRemoteUserName}
            onClose={handleClose}
          />

          {/* Video Grid */}
          <div className="h-full pt-16 pb-32 flex flex-col">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">{t('errorTitle')}</h3>
                <p className="text-white/60 mb-6 max-w-md">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => join()}
                  className="px-6 py-3 bg-brand rounded-full text-white font-bold"
                >
                  {t('tryAgain')}
                </motion.button>
              </div>
            ) : (
              <VideoGrid
                localVideoTrack={localVideoTrack}
                remoteVideoTracks={remoteVideoTracks}
                localUserName={finalLocalUserName}
                remoteUserName={finalRemoteUserName}
                isCameraEnabled={isCameraEnabled}
              />
            )}
          </div>

          {/* Controls */}
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

          <ConnectingOverlay isConnecting={isConnecting} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}