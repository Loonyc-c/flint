'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface CallControlsProps {
  isMicEnabled: boolean
  isCameraEnabled: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onEndCall: () => void
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export const CallControls = ({
  isMicEnabled,
  isCameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  className,
}: CallControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-center gap-4 p-4",
        className
      )}
    >
      {/* Mic Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleMic}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          isMicEnabled
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        )}
        aria-label={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
      </motion.button>

      {/* Camera Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleCamera}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          isCameraEnabled
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        )}
        aria-label={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
      </motion.button>

      {/* End Call */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
        aria-label="End call"
      >
        <PhoneOff className="w-7 h-7" />
      </motion.button>

      {/* More Options */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
        aria-label="More options"
      >
        <MoreVertical className="w-6 h-6" />
      </motion.button>
    </motion.div>
  )
}
