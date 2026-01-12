'use client'

import { motion } from 'framer-motion'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTranslations } from 'next-intl'

export const SwipeSkeleton = () => {
  const t = useTranslations('swipe.states')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-6"
    >
      {/* Animated card skeleton */}
      <div className="relative w-full aspect-[1/1.5] sm:aspect-[1/1.4] max-h-[600px] mx-auto px-4 sm:px-6">
        <motion.div
          className="w-full h-full bg-neutral-200 dark:bg-neutral-800 rounded-3xl shadow-xl overflow-hidden"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {/* Photo area */}
          <div className="h-1/2 bg-neutral-300 dark:bg-neutral-700" />

          {/* Content area */}
          <div className="p-4 space-y-3">
            <div className="h-6 w-2/3 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
            <div className="h-4 w-1/2 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
            <div className="h-16 w-full bg-neutral-300 dark:bg-neutral-700 rounded-xl mt-4" />
          </div>
        </motion.div>

        {/* Stacked cards behind */}
        <div className="absolute inset-0 -z-10 transform scale-[0.95] translate-y-3 bg-neutral-300 dark:bg-neutral-700 rounded-3xl opacity-50" />
        <div className="absolute inset-0 -z-20 transform scale-[0.90] translate-y-6 bg-neutral-300 dark:bg-neutral-700 rounded-3xl opacity-25" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner fullScreen={false} />
        <motion.p
          className="text-sm font-bold tracking-widest uppercase text-neutral-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {t('finding')}
        </motion.p>
      </div>
    </motion.div>
  )
}
