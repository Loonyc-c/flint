'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { useAgora } from '../../hooks/useAgora'
import { VideoGrid } from '../VideoGrid'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/ui/UserAvatar'

// =============================================================================
// Types
// =============================================================================

interface StagedAudioCallModalProps {
  isOpen: boolean
  channelName: string
  partnerName: string
  partnerAvatar?: string
  remainingTime: number // milliseconds
  stage: 1 | 2
  isPaused?: boolean
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

export const StagedAudioCallModal = ({
  isOpen,
  channelName,
  partnerName,
  partnerAvatar,
  remainingTime,
  stage,
  isPaused = false,
  onClose,
  onCallEnded,
}: StagedAudioCallModalProps) => {
  const t = useTranslations('video.staged')
  const th = useTranslations('video.header')
  const previousStage = useRef(stage)

  const {
    isConnected,
    isConnecting,
    isMicEnabled,
    isCameraEnabled,
    localVideoTrack,
    remoteVideoTracks,
    join,
    leave,
    toggleMic,
    toggleCamera,
    muteAll,
    unmuteAll,
    error,
  } = useAgora({ channelName, enableVideo: stage === 2 })

  // Auto-join when modal opens
  useEffect(() => {
    if (isOpen && channelName && !isConnected && !isConnecting) {
      join()
    }
  }, [isOpen, channelName, isConnected, isConnecting, join])

  // Handle Paused State (Interstitial)
  useEffect(() => {
    if (!isConnected) return

    if (isPaused) {
      muteAll()
    } else {
      // If resuming, restore based on stage
      // Stage 1: Audio only (video false)
      // Stage 2: Audio + Video (if enabled)
      unmuteAll(true, stage === 2) 
    }
  }, [isPaused, isConnected, muteAll, unmuteAll, stage])

  // Handle Stage Transition (1 -> 2)
  useEffect(() => {
    if (previousStage.current === 1 && stage === 2 && isConnected) {
      // Transitioning to video
      if (!isCameraEnabled) {
        toggleCamera()
      }
    }
    previousStage.current = stage
  }, [stage, isConnected, isCameraEnabled, toggleCamera])

  // Handle end call
  const handleEndCall = useCallback(async () => {
    await leave()
    onCallEnded?.()
    onClose()
  }, [leave, onCallEnded, onClose])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Explicit cleanup handled by useAgora, but double check
      if (isConnected) leave()
    }
  }, [isConnected, leave])

  const progress = stage === 1 ? (90000 - remainingTime) / 90000 : (120000 - remainingTime) / 120000

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 overflow-hidden"
        >
          {/* Background Blur Effect when Paused */}
          <div className={cn(
            "absolute inset-0 transition-all duration-500",
            isPaused ? "backdrop-blur-xl bg-black/40 z-10" : "z-0"
          )} />

          {/* Main Content */}
          <div className={cn(
            "relative w-full h-full flex flex-col items-center justify-center p-4 transition-all duration-500",
            isPaused && "scale-95 opacity-50 blur-sm"
          )}>
            
            {stage === 2 ? (
              // Stage 2: Video Layout
              <div className="w-full h-full max-w-5xl max-h-[80vh] bg-black/50 rounded-3xl overflow-hidden border border-white/10 relative">
                <VideoGrid
                  localVideoTrack={localVideoTrack}
                  remoteVideoTracks={remoteVideoTracks}
                  localUserName="You"
                  remoteUserName={partnerName}
                  isCameraEnabled={isCameraEnabled}
                />
                
                {/* Overlay Controls for Video */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleMic}
                    className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      isMicEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white")}>
                    {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </motion.button>
                  
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleCamera}
                    className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      isCameraEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white")}>
                    {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleEndCall}
                    className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                    <PhoneOff className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
            ) : (
              // Stage 1: Audio Layout
              <div className="text-center w-full max-w-md">
                {/* Timer Ring */}
                <div className="relative w-48 h-48 mx-auto mb-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-800" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"
                      className="text-brand" strokeLinecap="round"
                      strokeDasharray={`${progress * 283} 283`} />
                  </svg>
                  {/* Avatar in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                      <UserAvatar 
                        src={partnerAvatar} 
                        name={partnerName} 
                        size="2xl" 
                        border
                        className="w-32 h-32"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Timer Display */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                  <h2 className="text-2xl font-bold text-white mb-2">{partnerName}</h2>
                  <p className="text-4xl font-mono font-bold text-brand">{formatTime(remainingTime)}</p>
                  <p className="text-neutral-400 text-sm mt-2">
                    {t('stage1')}
                  </p>
                </motion.div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500")} />
                  <span className="text-neutral-400 text-sm">
                    {isConnecting ? th('connecting') : isConnected ? th('connected') : error || th('waiting')}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleMic}
                    className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                      isMicEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white")}>
                    {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                    <PhoneOff className="w-7 h-7" />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Wave Animation (Audio Only) */}
            {stage === 1 && (
              <motion.div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-30 pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ x: [0, -100, 0] }} transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute bottom-0 left-0 right-0 h-16" style={{ bottom: i * 20 }}>
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-[200%] h-full">
                      <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.1,118.92,100.89,77.57,145.77,63.09c62.84-20.22,126.83-21.39,191.68-7.36Z" className="fill-brand/20" />
                    </svg>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
