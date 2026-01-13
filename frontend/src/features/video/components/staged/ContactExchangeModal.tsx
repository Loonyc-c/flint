'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Heart, Phone, Instagram, MessageCircle, X, CheckCircle2 } from 'lucide-react'
import { STAGED_CALL_CONSTANTS, type ContactInfoDisplay } from '@shared/types'
import { useTranslations } from 'next-intl'

// =============================================================================
// Types
// =============================================================================

interface ContactExchangeModalProps {
  isOpen: boolean
  partnerName: string
  contactInfo: ContactInfoDisplay
  expiresAt: string
  onClose: () => void
}

// =============================================================================
// Contact Icons Map
// =============================================================================

const contactIcons: Record<string, React.ElementType> = {
  phone: Phone,
  instagram: Instagram,
  telegram: MessageCircle,
  snapchat: MessageCircle,
  whatsapp: Phone,
  wechat: MessageCircle,
  facebook: MessageCircle,
  twitter: MessageCircle,
  linkedin: MessageCircle,
  other: MessageCircle,
}

// =============================================================================
// Component
// =============================================================================

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
        onClose()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, expiresAt, onClose])

  const seconds = Math.ceil(remainingTime / 1000)
  const progress = remainingTime / STAGED_CALL_CONSTANTS.CONTACT_DISPLAY_DURATION

  // Filter out empty contacts and metadata
  const validContacts = Object.entries(contactInfo).filter(
    ([key, value]) => value && key !== 'verifiedPlatforms' && key !== 'isContactVerified'
  )

  const verifiedPlatforms = contactInfo.verifiedPlatforms || []

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-gradient-to-br from-brand/10 via-neutral-900 to-green-900/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-brand/20"
          >
            {/* Screenshot Prompt */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand px-4 py-2 rounded-full shadow-lg shadow-brand/30 flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">{t('screenshot')}</span>
            </motion.div>

            {/* Header */}
            <div className="text-center mb-6 pt-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand to-green-500 flex items-center justify-center"
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
                <span className={seconds <= 10 ? 'text-red-400 font-bold' : 'text-brand'}>{seconds}s</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div className={`h-full ${seconds <= 10 ? 'bg-red-500' : 'bg-brand'}`}
                  style={{ width: `${progress * 100}%` }} transition={{ duration: 0.1 }} />
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 space-y-3 mb-6">
              {validContacts.length > 0 ? (
                validContacts.map(([key, value]) => {
                  const Icon = contactIcons[key] || MessageCircle
                  const isVerified = verifiedPlatforms.includes(key)
                  
                  return (
                    <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center relative">
                        <Icon className="w-5 h-5 text-brand" />
                        {isVerified && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                            <CheckCircle2 className="w-3 h-3 text-success fill-success/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-neutral-400">{t(`labels.${key}`)}</p>
                          {isVerified && (
                            <span className="text-[8px] font-bold text-success uppercase tracking-tighter">
                              {t('verified')}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium truncate">{value}</p>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <p className="text-neutral-400 text-center py-4">{t('empty')}</p>
              )}
            </div>

            {/* Close Button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              className="w-full py-3 px-6 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              <X className="w-5 h-5" />
              {tc('close')}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
