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
  remainingTime?: number
  stage?: number
  onClose: () => void
  onCallEnded?: () => void
}

// =============================================================================
// Helper
// =============================================================================

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// =============================================================================
// Component
// =============================================================================

export const VideoCallModal = ({
  isOpen,
  channelName,
  localUserName = 'You',
  remoteUserName = 'Partner',
  remainingTime = 0,
  stage = 2,
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
            className="absolute top-0 left-0 right-0 z-20 flex flex-col pt-0"
          >
            {/* Progress Bar */}
            {isConnected && remainingTime > 0 && (
              <div className="h-1 w-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-brand"
                  initial={{ width: '100%' }}
                  animate={{ 
                    width: `${(remainingTime / (stage === 1 ? 90000 : 120000)) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"
                )} />
                <div>
                  <h2 className="text-white font-bold">{remoteUserName}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-white/60 text-sm">
                      {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Waiting...'}
                    </p>
                    {isConnected && remainingTime > 0 && (
                      <>
                        <span className="text-white/40 text-xs">•</span>
                        <span className="text-brand font-mono font-bold text-sm">
                          {formatTime(remainingTime)}
                        </span>
                      </>
                    )}
                  </div>
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
            </div>
          </motion.div>

          {/* Video Grid */}
          <div className="h-full pt-16 pb-32 flex flex-col">
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
