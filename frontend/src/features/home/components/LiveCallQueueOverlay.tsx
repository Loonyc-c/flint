'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { type LiveCallStatus } from '@/features/live-call/context/LiveCallContext'

interface LiveCallQueueOverlayProps {
  status: LiveCallStatus
  onCancel: () => void
}

export const LiveCallQueueOverlay = ({ status, onCancel }: LiveCallQueueOverlayProps) => {
  const t = useTranslations('home.findMatch.liveCall')

  if (status !== 'queueing' && status !== 'connecting') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        <div className="w-full max-w-md p-8 text-center bg-card rounded-3xl border border-border shadow-2xl mx-4">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-brand rounded-full"
            />
            <div className="relative flex items-center justify-center w-full h-full bg-brand rounded-full text-brand-foreground">
              {status === 'queueing' ? (
                <Phone className="w-10 h-10 animate-pulse" />
              ) : (
                <ShieldCheck className="w-10 h-10" />
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            {status === 'queueing' ? t('finding') : t('matchFound')}
          </h2>

          <p className="text-muted-foreground mb-8">
            {status === 'queueing'
              ? t('findingDesc')
              : t('connecting')}
          </p>

          {status === 'queueing' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 text-sm text-brand font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('searching')}
              </div>
              <Button variant="outline" onClick={onCancel} className="rounded-xl">
                {t('cancel')}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
