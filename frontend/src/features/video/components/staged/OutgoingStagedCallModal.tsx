'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Mic, Video } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/ui/UserAvatar'

// =============================================================================
// Types
// =============================================================================

interface OutgoingStagedCallModalProps {
  isOpen: boolean
  calleeName: string
  calleeAvatar?: string
  stage: 1 | 2
  callType: 'audio' | 'video'
  onCancel: () => void
}

// =============================================================================
// Component
// =============================================================================

export const OutgoingStagedCallModal = ({
  isOpen,
  calleeName,
  calleeAvatar,
  stage,
  callType,
  onCancel,
}: OutgoingStagedCallModalProps) => {
  const t = useTranslations('video.staged')
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Play outgoing ring sound (ringback tone)
  useEffect(() => {
    if (!isOpen) {
      // Clean up audio when modal closes
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      return
    }

    // Create ringback tone (different from incoming ring)
    const playRingback = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
        }
        const ctx = audioContextRef.current

        const playTone = () => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          
          osc.connect(gain)
          gain.connect(ctx.destination)
          
          // US ringback tone: 440Hz + 480Hz
          osc.frequency.value = 440
          osc.type = 'sine'
          gain.gain.value = 0.1
          
          osc.start()
          
          // Ring pattern: 2s on, 4s off
          setTimeout(() => {
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
            setTimeout(() => osc.stop(), 100)
          }, 2000)
        }

        playTone()
        intervalRef.current = setInterval(playTone, 6000)
      } catch (e) {
        console.warn('Could not play ringback tone:', e)
      }
    }

    playRingback()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [isOpen])

  const CallIcon = callType === 'audio' ? Mic : Video

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden"
          >
            {/* Animated Background Rings - Slower pulse for outgoing */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 0.7, 1.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 2], opacity: [0.2, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay }}
                  className="absolute w-32 h-32 rounded-full border-2 border-green-500/50"
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Call Type Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CallIcon className="w-6 h-6 text-green-500" />
              </motion.div>

              {/* Callee Avatar */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="relative mx-auto mb-6 w-28 h-28"
              >
                <UserAvatar 
                  src={calleeAvatar} 
                  name={calleeName} 
                  size="2xl" 
                  border
                  className="w-28 h-28"
                />

                {/* Calling Indicator */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                >
                  <Phone className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              {/* Callee Info */}
              <h2 className="text-2xl font-bold text-white mb-1">{calleeName}</h2>
              <motion.p 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-green-400 mb-2"
              >
                {t('calling')}
              </motion.p>
              <p className="text-neutral-400 text-sm mb-6">
                {t('stageInfo', { stage, type: t(`types.${callType}`) })}
              </p>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="w-16 h-16 mx-auto rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-7 h-7" />
              </motion.button>
              <p className="text-neutral-500 text-xs mt-3">{t('outgoing')}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
