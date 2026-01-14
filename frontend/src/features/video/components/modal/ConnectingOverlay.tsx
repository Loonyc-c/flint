'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface ConnectingOverlayProps {
  isConnecting: boolean
}

export const ConnectingOverlay = ({ isConnecting }: ConnectingOverlayProps) => {
  const t = useTranslations('video.staged.overlay')

  return (
    <AnimatePresence>
      {isConnecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-4 border-4 border-brand/30 border-t-brand rounded-full"
            />
            <p className="text-white text-lg font-medium">{t('connecting')}</p>
            <p className="text-white/60 text-sm mt-1">{t('pleaseWait')}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
