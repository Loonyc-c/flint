'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

// =============================================================================
// Types
// =============================================================================

interface IncomingCallModalProps {
  isOpen: boolean
  callerName: string
  callerAvatar?: string
  onAccept: () => void
  onDecline: () => void
}

// =============================================================================
// Component
// =============================================================================

export const IncomingCallModal = ({
  isOpen,
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
}: IncomingCallModalProps) => {
  const t = useTranslations('video.staged')

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
            {/* Animated Background Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                className="absolute w-32 h-32 rounded-full border-2 border-brand/50"
              />
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.5 }}
                className="absolute w-32 h-32 rounded-full border-2 border-brand/50"
              />
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 1 }}
                className="absolute w-32 h-32 rounded-full border-2 border-brand/50"
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Video Icon */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand/20 flex items-center justify-center"
              >
                <Video className="w-6 h-6 text-brand" />
              </motion.div>

              {/* Caller Avatar */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="relative w-28 h-28 mx-auto mb-6"
              >
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-brand/30 shadow-xl shadow-brand/20">
                  {callerAvatar ? (
                    <Image
                      src={callerAvatar}
                      alt={callerName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand to-brand-300 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {callerName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Ringing Indicator */}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow-lg"
                >
                  <Phone className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              {/* Caller Info */}
              <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
              <p className="text-neutral-400 mb-8">{t('incoming')}</p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6">
                {/* Decline */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onDecline}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  <PhoneOff className="w-7 h-7" />
                </motion.button>

                {/* Accept */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30"
                >
                  <Phone className="w-7 h-7" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
