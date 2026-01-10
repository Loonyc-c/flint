'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng'
import { VideoOff, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface VideoGridProps {
  localVideoTrack: ICameraVideoTrack | null
  remoteVideoTracks: Map<number, IRemoteVideoTrack>
  localUserName?: string
  remoteUserName?: string
  isCameraEnabled: boolean
}

// =============================================================================
// Sub-Components
// =============================================================================

interface VideoPlayerProps {
  track: ICameraVideoTrack | IRemoteVideoTrack | null
  isLocal?: boolean
  userName?: string
  isCameraEnabled?: boolean
  className?: string
}

const VideoPlayer = ({
  track,
  isLocal = false,
  userName = 'User',
  isCameraEnabled = true,
  className,
}: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (track && containerRef.current && isCameraEnabled) {
      track.play(containerRef.current)

      return () => {
        track.stop()
      }
    }
  }, [track, isCameraEnabled])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative bg-neutral-900 rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Video Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
      />

      {/* Placeholder when camera is off */}
      {(!track || !isCameraEnabled) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
          <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
            {isCameraEnabled ? (
              <User className="w-12 h-12 text-neutral-500" />
            ) : (
              <VideoOff className="w-12 h-12 text-neutral-500" />
            )}
          </div>
          <p className="text-neutral-400 text-sm font-medium">
            {isCameraEnabled ? 'Connecting...' : 'Camera Off'}
          </p>
        </div>
      )}

      {/* Name Label */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
        <p className="text-white text-sm font-medium">
          {isLocal ? 'You' : userName}
        </p>
      </div>

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-4 right-4 z-20 px-2 py-1 bg-brand/80 backdrop-blur-sm rounded-full">
          <p className="text-white text-xs font-bold">LIVE</p>
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export const VideoGrid = ({
  localVideoTrack,
  remoteVideoTracks,
  localUserName = 'You',
  remoteUserName = 'Partner',
  isCameraEnabled,
}: VideoGridProps) => {
  const remoteTracksArray = Array.from(remoteVideoTracks.entries())
  const hasRemote = remoteTracksArray.length > 0

  return (
    <div className="flex-1 h-full p-4 relative">
      {/* Main Layout */}
      {hasRemote ? (
        // Two-person call layout
        <div className="h-full flex flex-col gap-4">
          {/* Remote Video (Large) */}
          <div className="flex-1 min-h-0">
            {remoteTracksArray.map(([uid, track]) => (
              <VideoPlayer
                key={uid}
                track={track}
                userName={remoteUserName}
                isCameraEnabled={true}
                className="w-full h-full"
              />
            ))}
          </div>

          {/* Local Video (Small, Picture-in-Picture) */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute bottom-24 right-8 w-32 h-44 sm:w-40 sm:h-56 z-10 shadow-2xl cursor-move"
          >
            <VideoPlayer
              track={localVideoTrack}
              isLocal
              userName={localUserName}
              isCameraEnabled={isCameraEnabled}
              className="w-full h-full ring-2 ring-white/20"
            />
          </motion.div>
        </div>
      ) : (
        // Waiting for partner
        <div className="h-full flex flex-col">
          {/* Local Video (Full screen while waiting) */}
          <VideoPlayer
            track={localVideoTrack}
            isLocal
            userName={localUserName}
            isCameraEnabled={isCameraEnabled}
            className="w-full h-full"
          />

          {/* Waiting Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/20 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-brand/40 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-brand" />
                </div>
              </motion.div>
              <p className="text-white text-lg font-bold mb-1">Calling...</p>
              <p className="text-white/60 text-sm">Waiting for {remoteUserName} to join</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
