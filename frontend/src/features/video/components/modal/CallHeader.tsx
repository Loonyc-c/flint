'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface CallHeaderProps {
  isConnected: boolean
  isConnecting: boolean
  remainingTime: number
  stage: number
  remoteUserName: string
  onClose: () => void
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const CallHeader = ({
  isConnected,
  isConnecting,
  remainingTime,
  stage,
  remoteUserName,
  onClose,
}: CallHeaderProps) => {
  const t = useTranslations('video.header')

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-20 flex flex-col pt-0"
    >
      {/* Progress Bar */}
      {isConnected && remainingTime > 0 && (
        <div className="h-1 w-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-brand"
            initial={{ width: '100%' }}
            animate={{
              width: `${(remainingTime / (stage === 1 ? 90000 : 120000)) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
            )}
          />
          <div>
            <h2 className="text-white font-bold">{remoteUserName}</h2>
            <div className="flex items-center gap-2">
              <p className="text-white/60 text-sm">
                {isConnecting ? t('connecting') : isConnected ? t('connected') : t('waiting')}
              </p>
              {isConnected && remainingTime > 0 && (
                <>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-brand font-mono font-bold text-sm">
                    {formatTime(remainingTime)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
