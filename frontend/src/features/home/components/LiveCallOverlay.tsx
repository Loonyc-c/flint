'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLiveCall } from '../hooks/useLiveCall'
import { StagedAudioCallModal, StagePromptModal } from '@/features/video/components/staged'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'

interface LiveCallOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const LiveCallOverlay = ({ isOpen, onClose }: LiveCallOverlayProps) => {
  const t = useTranslations('home.findMatch.liveCall')
  const tv = useTranslations('video.staged')
  
  const { 
    status, 
    matchData, 
    error, 
    joinQueue, 
    leaveQueue, 
    promoteToMatch,
    reset 
  } = useLiveCall()

  // For the actual call logic, we can use useStagedCall or just handle it here.
  // Since we have an ephemeral match, useStagedCall might not work out of the box
  // if it expects to emit events with a real matchId to the backend which expects a DB match.
  // However, our live-call.handler.ts is separate.
  
  // Actually, let's keep it simple: 
  // 1. Queueing UI
  // 2. Connecting UI
  // 3. In-Call UI (StagedAudioCallModal)
  
  const [remainingTime, setRemainingTime] = useState(90000)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (isOpen && status === 'idle') {
      joinQueue()
    }
    
    // Cleanup on unmount
    return () => {
      if (status === 'queueing' || status === 'connecting') {
        leaveQueue()
      }
    }
  }, [isOpen, status, joinQueue, leaveQueue])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (status === 'in-call') {
      setRemainingTime(90000)
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1000) {
            clearInterval(timer)
            setShowPrompt(true)
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status])

  const handleClose = () => {
    leaveQueue()
    reset()
    onClose()
  }

  const handlePromptResponse = (accepted: boolean) => {
    setShowPrompt(false)
    if (accepted && matchData) {
      promoteToMatch(matchData.partnerId)
      toast.success('Match created! Check your conversations.')
      handleClose()
    } else {
      toast.info('Call ended')
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        {(status === 'queueing' || status === 'connecting') && (
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
                  <Button variant="outline" onClick={handleClose} className="rounded-xl">
                    {t('cancel')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Call Modal */}
      {status === 'in-call' && matchData && !showPrompt && (
        <StagedAudioCallModal
          isOpen={true}
          channelName={matchData.channelName}
          partnerName={matchData.partnerName}
          remainingTime={remainingTime}
          stage={1}
          onClose={handleClose}
          onCallEnded={() => setShowPrompt(true)}
        />
      )}

      {/* Promotion Prompt */}
      <StagePromptModal
        isOpen={showPrompt}
        fromStage={1}
        expiresAt={new Date(Date.now() + 10000).toISOString()}
        onAccept={() => handlePromptResponse(true)}
        onDecline={() => handlePromptResponse(false)}
      />

      {status === 'error' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-2xl border border-border max-w-sm text-center">
            <h3 className="text-lg font-bold text-destructive mb-2">{t('error')}</h3>
            <p className="text-muted-foreground mb-4">{error || 'Something went wrong'}</p>
            <Button onClick={handleClose}>{tv('prompt.notNow')}</Button>
          </div>
        </div>
      )}
    </>
  )
}
