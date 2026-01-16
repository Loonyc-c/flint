'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Phone, X, Heart, ThumbsDown, Loader2, ShieldCheck, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useLiveCall,
  type LiveCallStatus as _LiveCallStatus
} from '@/features/live-call/hooks/useLiveCall'
import { useProfileReadiness } from '@/features/profile/hooks/useProfileReadiness'
import { ProfileGuidance } from '@/features/profile/components/ProfileGuidance'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/lib/utils'

interface LiveCallOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const LiveCallOverlay = ({ isOpen, onClose }: LiveCallOverlayProps) => {
  const t = useTranslations('home.findMatch.liveCall')
  const {
    status,
    matchData,
    remainingTime,
    error,
    hasLiked,
    hasPassed,
    joinQueue,
    leaveQueue,
    performAction,
    endCall,
    reset
  } = useLiveCall()

  const { score, missingFields, isReady, isLoading: isCheckingReadiness } = useProfileReadiness()
  const [showGuidance, setShowGuidance] = useState(false)

  useEffect(() => {
    if (isOpen && status === 'idle' && !isCheckingReadiness) {
      if (isReady) {
        joinQueue()
      } else {
        setShowGuidance(true)
      }
    }
  }, [isOpen, isReady, isCheckingReadiness, status, joinQueue])

  const handleClose = () => {
    if (status === 'queueing' || status === 'connecting') {
      leaveQueue()
    }
    reset()
    setShowGuidance(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <div className="w-full max-w-md relative">
          {/* Close Button */}

          {showGuidance ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-card rounded-3xl p-6 shadow-2xl border border-border"
            >
              <ProfileGuidance
                score={score}
                missingFields={missingFields}
                isLoading={isCheckingReadiness}
                onClose={handleClose}
              />
            </motion.div>
          ) : (
            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              {/* Queueing / Connecting State */}
              {(status === 'queueing' || status === 'connecting') && (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-brand rounded-full"
                    />
                    <div className="relative flex items-center justify-center w-full h-full bg-brand rounded-full text-brand-foreground shadow-lg shadow-brand/20">
                      {status === 'queueing' ? (
                        <Phone className="w-10 h-10 animate-pulse" />
                      ) : (
                        <ShieldCheck className="w-10 h-10" />
                      )}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {status === 'queueing' ? t('finding') : t('matchFound')}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    {status === 'queueing' ? t('findingDesc') : t('connecting')}
                  </p>
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex items-center justify-center gap-2 text-sm text-brand font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('searching')}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="rounded-2xl h-12 border-2"
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Call State */}
              {status === 'in-call' && matchData && (
                <div className="flex flex-col h-full max-h-[90vh]">
                  <div className="bg-brand/5 pb-8 pt-12 text-center relative border-b border-border/50">
                    {/* Timer */}
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-mono border border-border flex items-center gap-2 shadow-sm">
                      <Timer
                        className={cn(
                          'w-4 h-4',
                          remainingTime < 15 ? 'text-destructive animate-pulse' : 'text-brand'
                        )}
                      />
                      <span
                        className={cn(
                          remainingTime < 15 ? 'text-destructive font-bold' : 'text-foreground'
                        )}
                      >
                        {Math.floor(remainingTime / 60)}:
                        {(remainingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <UserAvatar
                          src={matchData.partner.photo}
                          name={matchData.partner.nickName}
                          size="2xl"
                          border
                          className="w-32 h-32 ring-4 ring-brand/10"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-card"
                        />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {matchData.partner.nickName}, {matchData.partner.age}
                    </h2>
                    <p className="text-brand font-bold mt-2 uppercase tracking-widest text-[10px]">
                      {t('connected')}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center py-12 px-8">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                    </div>
                    <p className="text-muted-foreground text-center font-medium leading-relaxed">
                      {t('talkingTo', { name: matchData.partner.nickName })}
                    </p>
                  </div>

                  <div className="p-10 flex justify-center gap-8 bg-muted/30 border-t border-border">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => performAction('pass')}
                      disabled={hasPassed || hasLiked}
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg',
                        hasPassed
                          ? 'bg-neutral-200 text-neutral-400'
                          : 'bg-white dark:bg-neutral-800 text-neutral-500 hover:text-destructive hover:shadow-destructive/20 border border-border'
                      )}
                    >
                      <ThumbsDown className="w-7 h-7" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => performAction('like')}
                      disabled={hasPassed || hasLiked}
                      className={cn(
                        'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl',
                        hasLiked
                          ? 'bg-brand/50 text-white scale-95'
                          : 'bg-brand text-white hover:bg-brand-300 shadow-brand/30'
                      )}
                    >
                      <Heart className={cn('w-10 h-10', hasLiked && 'fill-current')} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClose}
                      className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 text-neutral-500 hover:text-foreground border border-border flex items-center justify-center shadow-lg transition-all"
                    >
                      <X className="w-7 h-7" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Call Ended State */}
              {status === 'ended' && (
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <X className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{t('callEnded')}</h3>
                  {hasLiked && !hasPassed && (
                    <p className="text-brand font-medium mb-8 bg-brand/10 px-4 py-2 rounded-full text-sm">
                      {t('matchPending')}
                    </p>
                  )}
                  <Button
                    onClick={handleClose}
                    className="w-full h-12 rounded-2xl font-bold bg-brand hover:bg-brand-300 text-brand-foreground shadow-lg shadow-brand/20"
                  >
                    {t('backToHome')}
                  </Button>
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <Phone className="w-10 h-10 text-destructive rotate-[135deg]" />
                  </div>
                  <h3 className="text-2xl font-bold text-destructive mb-2">{t('error')}</h3>
                  <p className="text-muted-foreground mb-8 text-sm">
                    {error === 'err.live_call.connection_failed'
                      ? 'Failed to connect to voice channel please check your microphone and network settings.'
                      : error || 'Something went wrong'}
                  </p>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-bold border-2"
                  >
                    {t('backToHome')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
