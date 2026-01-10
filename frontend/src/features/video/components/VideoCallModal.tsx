'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAgora } from '../hooks/useAgora'
import { CallControls } from './CallControls'
import { VideoGrid } from './VideoGrid'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface VideoCallModalProps {
  isOpen: boolean
  channelName: string
  localUserName?: string
  remoteUserName?: string
  onClose: () => void
  onCallEnded?: () => void
}

// =============================================================================
// Component
// =============================================================================

export const VideoCallModal = ({
  isOpen,
  channelName,
  localUserName = 'You',
  remoteUserName = 'Partner',
  onClose,
  onCallEnded,
}: VideoCallModalProps) => {
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"
              )} />
              <div>
                <h2 className="text-white font-bold">{remoteUserName}</h2>
                <p className="text-white/60 text-sm">
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Waiting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Video Grid */}
          <div className="h-full pt-16 pb-32">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Connection Error</h3>
                <p className="text-white/60 mb-6 max-w-md">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => join()}
                  className="px-6 py-3 bg-brand rounded-full text-white font-bold"
                >
                  Try Again
                </motion.button>
              </div>
            ) : (
              <VideoGrid
                localVideoTrack={localVideoTrack}
                remoteVideoTracks={remoteVideoTracks}
                localUserName={localUserName}
                remoteUserName={remoteUserName}
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

          {/* Connecting Overlay */}
          <AnimatePresence>
            {isConnecting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 border-4 border-brand/30 border-t-brand rounded-full"
                  />
                  <p className="text-white text-lg font-medium">Connecting to call...</p>
                  <p className="text-white/60 text-sm mt-1">Please wait</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
