'use client'

import { motion } from 'framer-motion'
import { RotateCcw, Heart, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface EmptyStateProps {
  onRefresh: () => void
  isRefreshing?: boolean
}

export const EmptyState = ({ onRefresh, isRefreshing }: EmptyStateProps) => {
  const t = useTranslations('swipe.states')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center sm:p-8"
    >
      {/* Animated heart icon */}
      <motion.div
        className="relative mb-8"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-brand to-brand-300 shadow-2xl shadow-brand/30">
          <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-white" />
        </div>

        {/* Floating sparkles */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>

        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand/30"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      <h2 className="mb-3 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
        {t('noMoreTitle')}
      </h2>
      <p className="max-w-sm mb-8 text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {t('noMoreSubtitle')}
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-3 px-8 py-4 font-bold text-white transition-all shadow-xl cursor-pointer bg-gradient-to-r from-brand to-brand-300 rounded-2xl shadow-brand/30 hover:shadow-2xl hover:shadow-brand/40 disabled:opacity-50"
      >
        <RotateCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? t('refreshing') : t('refreshButton')}
      </motion.button>
    </motion.div>
  )
}
