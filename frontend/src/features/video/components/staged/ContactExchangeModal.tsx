'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Heart, X, Sparkles } from 'lucide-react'
import { STAGED_CALL_CONSTANTS, type ContactInfoDisplay } from '@shared/types'
import { useTranslations } from 'next-intl'
import { ContactRevealCard } from './ContactRevealCard'

interface ContactExchangeModalProps {
  isOpen: boolean
  partnerName: string
  contactInfo: ContactInfoDisplay
  expiresAt: string
  onClose: () => void
}

export const ContactExchangeModal = ({
  isOpen,
  partnerName,
  contactInfo,
  expiresAt,
  onClose,
}: ContactExchangeModalProps) => {
  const t = useTranslations('video.staged.exchange')
  const tc = useTranslations('common')
  const [remainingTime, setRemainingTime] = useState<number>(STAGED_CALL_CONSTANTS.CONTACT_DISPLAY_DURATION)
  const [isRevealed, setIsRevealed] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return

    // Reveal animation delay
    const revealTimer = setTimeout(() => setIsRevealed(true), 800)

    const expiryTime = new Date(expiresAt).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, expiryTime - now)
      setRemainingTime(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onClose()
      }
    }, 100)

    return () => {
      clearInterval(interval)
      clearTimeout(revealTimer)
    }
  }, [isOpen, expiresAt, onClose])

  const seconds = Math.ceil(remainingTime / 1000)
  const progress = remainingTime / STAGED_CALL_CONSTANTS.CONTACT_DISPLAY_DURATION

  const hasInstagram = !!contactInfo.instagram

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateY: -180 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            style={{ perspective: 1000 }}
            className="relative bg-gradient-to-br from-brand/10 via-neutral-900 to-success/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-brand/20"
          >
            {/* Reveal Sparkles */}
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                className="absolute inset-0 pointer-events-none"
              >
                <Sparkles className="absolute top-1/4 left-1/4 w-8 h-8 text-brand animate-pulse" />
                <Sparkles className="absolute bottom-1/4 right-1/4 w-8 h-8 text-success animate-pulse delay-75" />
              </motion.div>
            )}

            {/* Screenshot Prompt */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isRevealed ? { y: 0, opacity: 1 } : {}}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand px-4 py-2 rounded-full shadow-lg shadow-brand/30 flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">{t('screenshot')}</span>
            </motion.div>

            {/* Header */}
            <div className="text-center mb-6 pt-2">
              <motion.div
                animate={isRevealed ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center shadow-lg shadow-brand/40"
              >
                <Heart className="w-8 h-8 text-white fill-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-white">{t('partnerContact', { name: partnerName })}</h2>
              <p className="text-neutral-400 text-sm mt-1">{t('unlocked')}</p>
            </div>

            {/* Timer Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">{t('timeRemaining')}</span>
                <span className={seconds <= 10 ? 'text-destructive font-bold' : 'text-brand'}>{seconds}s</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div className={`h-full ${seconds <= 10 ? 'bg-destructive' : 'bg-brand'}`}
                  style={{ width: `${progress * 100}%` }} transition={{ duration: 0.1 }} />
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 space-y-3 mb-6 min-h-24 flex flex-col justify-center">
              <ContactRevealCard
                isRevealed={isRevealed}
                hasInstagram={hasInstagram}
                contactInfo={contactInfo}
              />
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <X className="w-5 h-5" />
              {tc('close')}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
