'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Mic, ArrowRight, X, Sparkles } from 'lucide-react'
import { STAGED_CALL_CONSTANTS } from '@shared/types'

// =============================================================================
// Types
// =============================================================================

interface StagePromptModalProps {
  isOpen: boolean
  fromStage: 1 | 2
  expiresAt: string
  onAccept: () => void
  onDecline: () => void
}

// =============================================================================
// Component
// =============================================================================

export const StagePromptModal = ({
  isOpen,
  fromStage,
  expiresAt,
  onAccept,
  onDecline,
}: StagePromptModalProps) => {
  const [remainingTime, setRemainingTime] = useState<number>(STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT)

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return

    const expiryTime = new Date(expiresAt).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, expiryTime - now)
      setRemainingTime(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onDecline()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, expiresAt, onDecline])

  const seconds = Math.ceil(remainingTime / 1000)
  const progress = remainingTime / STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT

  const nextStageInfo = fromStage === 1
    ? { icon: Video, title: 'Video Call', desc: 'See each other for 2 minutes', color: 'brand' }
    : { icon: Sparkles, title: 'Exchange Contacts', desc: 'Share your contact info', color: 'green' }

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
            {/* Progress Ring */}
            <div className="absolute top-4 right-4">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-700" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                  className={progress > 0.3 ? 'text-brand' : 'text-red-500'}
                  strokeLinecap="round" strokeDasharray={`${progress * 100.5} 100.5`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {seconds}
              </span>
            </div>

            {/* Stage Transition Icon */}
            <div className="flex items-center justify-center gap-3 mb-6 mt-4">
              <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center">
                <Mic className="w-7 h-7 text-brand" />
              </div>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                <ArrowRight className="w-6 h-6 text-neutral-500" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  fromStage === 1 ? 'bg-brand/30' : 'bg-green-500/30'
                }`}
              >
                <nextStageInfo.icon className={`w-7 h-7 ${fromStage === 1 ? 'text-brand' : 'text-green-500'}`} />
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">Continue to {nextStageInfo.title}?</h2>
            <p className="text-neutral-400 mb-8">{nextStageInfo.desc}</p>

            {/* Waiting indicator */}
            <div className="mb-6 py-3 px-4 bg-white/5 rounded-xl">
              <p className="text-sm text-neutral-300">
                Waiting for both of you to respond...
              </p>
              <div className="flex justify-center gap-2 mt-2">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-brand"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-brand"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-brand"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDecline}
                className="flex-1 py-3 px-6 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-5 h-5" />
                Not Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAccept}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                  fromStage === 1
                    ? 'bg-brand hover:bg-brand/90 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <nextStageInfo.icon className="w-5 h-5" />
                Let&apos;s Go!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
