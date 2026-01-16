'use client'

import { motion } from 'framer-motion'
import { X, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SwipeCardActionsProps {
  onPass: () => void
  onLike: () => void
  disabled?: boolean
}

/**
 * Fixed action buttons for Like/Pass that remain visible during scroll.
 */
export const SwipeCardActions = ({
  onPass,
  onLike,
  disabled = false,
}: SwipeCardActionsProps) => {
  const t = useTranslations('swipe.controls')

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-center gap-4 px-4">
        {/* Pass Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPass}
          disabled={disabled}
          className="w-16 h-16 rounded-full bg-destructive text-white flex items-center justify-center shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          aria-label={t('pass')}
        >
          <X className="w-8 h-8" />
        </motion.button>

        {/* Like Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          disabled={disabled}
          className="w-20 h-20 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-xl shadow-brand/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          aria-label={t('like')}
        >
          <Heart className="w-10 h-10 fill-current" />
        </motion.button>
      </div>
    </div>
  )
}

