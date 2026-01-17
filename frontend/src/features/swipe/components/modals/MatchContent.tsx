'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Sparkles, PartyPopper } from 'lucide-react'
import { type User } from '@shared/types'
import { useRouter } from '@/i18n/routing'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface MatchContentProps {
  showContent: boolean
  matchedUser: User
  onClose: () => void
}

export const MatchContent = ({ showContent, matchedUser, onClose }: MatchContentProps) => {
  const t = useTranslations('swipe.modals.match')
  const router = useRouter()
  const userPhoto = matchedUser.profile?.photo
  const userName = matchedUser.profile?.nickName || 'User'

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 20 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: 0.1,
      }}
      className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Decorative sparkles */}
      <motion.div
        className="absolute top-4 left-4"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-6 h-6 text-yellow-400" />
      </motion.div>
      <motion.div
        className="absolute top-4 right-4"
        animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <PartyPopper className="w-6 h-6 text-brand" />
      </motion.div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Profile photo with animated border */}
            <div className="relative mx-auto w-28 h-28">
              {/* Animated ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-brand"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-brand/50"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Photo */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-xl">
                {userPhoto ? (
                  <Image
                    src={userPhoto}
                    alt={userName || 'Match'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand to-brand-300 flex items-center justify-center">
                    <span className="text-4xl">💕</span>
                  </div>
                )}
              </div>

              {/* Heart badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.5 }}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-brand to-brand-300 rounded-full flex items-center justify-center shadow-lg"
              >
                <Heart className="w-5 h-5 text-white fill-white" />
              </motion.div>
            </div>

            {/* Match text */}
            <div className="space-y-2">
              <motion.h2
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
                className="text-4xl sm:text-5xl font-black italic bg-gradient-to-r from-brand to-brand-300 bg-clip-text text-transparent uppercase tracking-tight"
              >
                {t('title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-neutral-600 dark:text-neutral-300 text-lg"
              >
                {t('subtitle', { name: userName })}
              </motion.p>
            </div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  router.push(`/swipe/chat/${matchedUser.id}`)
                }}
                className="w-full py-4 bg-gradient-to-r from-brand to-brand-300 text-white rounded-2xl font-bold text-lg tracking-wide shadow-xl shadow-brand/30 hover:shadow-2xl hover:shadow-brand/40 transition-shadow cursor-pointer flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                {t('startChatting')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl font-bold tracking-wide hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {t('keepSwiping')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
