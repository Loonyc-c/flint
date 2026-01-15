'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLiveCall } from '../hooks/useLiveCall'
import { StagedAudioCallModal, StagePromptModal, ContactExchangeModal } from '@/features/video/components/staged'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { LiveCallQueueOverlay } from './LiveCallQueueOverlay'
import { ProfileGuidance } from '@/features/profile/components/ProfileGuidance'
import { useProfileReadiness } from '@/features/profile/hooks/useProfileReadiness'
import { IcebreakerOverlay } from './IcebreakerOverlay'

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
    partnerContact,
    exchangeExpiresAt,
    icebreaker,
    error, 
    joinQueue, 
    leaveQueue, 
    promoteToMatch,
    reset 
  } = useLiveCall()

  const { score, missingFields, isReady, isLoading: isCheckingReadiness } = useProfileReadiness()
  const [showGuidance, setShowGuidance] = useState(false)

  // Ref to track status for cleanup function without triggering re-renders
  const statusRef = useRef(status)

  // Sync ref with status
  useEffect(() => {
    statusRef.current = status
  }, [status])
  
  const [remainingTime, setRemainingTime] = useState(90000)
  const [showPrompt, setShowPrompt] = useState(false)
  const [callStage, setCallStage] = useState<1 | 2 | 3>(1)

  // RCA: previously, 'status' was in the dependency array. 
  // When status changed from 'connecting' to 'in-call', the cleanup function ran.
  // The cleanup function checked 'connecting' (stale or current) and called leaveQueue(),
  // which reset the state to 'idle', triggering a re-join and the infinite loop.
  // FIX: Removed 'status' from dependencies. Use ref for cleanup logic.
  useEffect(() => {
    // Only auto-join if we are opening fresh and idle
    if (isOpen && status === 'idle' && !isCheckingReadiness) {
      if (isReady) {
        joinQueue()
      } else {
        setShowGuidance(true)
      }
    }
    
    // Cleanup on unmount or when isOpen changes to false
    return () => {
      // Use the ref to get the latest status during cleanup
      // regardless of closure staleness
      if (statusRef.current === 'queueing' || statusRef.current === 'connecting') {
        leaveQueue()
      }
    }
  }, [isOpen, status, isReady, isCheckingReadiness, joinQueue, leaveQueue])

  // Handle specific backend errors
  useEffect(() => {
    if (error === 'Profile incomplete') {
      setShowGuidance(true)
    }
  }, [error])

  // Timer logic for the call
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (status === 'in-call') {
      // Reset time based on stage
      const duration = callStage === 1 ? 90000 : 120000
      setRemainingTime(duration)
      
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1000) {
            clearInterval(timer)
            // If stage 1 ends, show prompt. If stage 2 ends, maybe end call?
            if (callStage === 1) {
              setShowPrompt(true)
            } else {
              toast.info('Time limit reached!')
              // handleClose() // Optional: auto-close
            }
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status, callStage]) // Re-run when status or stage changes

  const handleClose = () => {
    // Manual close should always leave queue if active
    if (status === 'queueing' || status === 'connecting') {
      leaveQueue()
    }
    reset()
    setCallStage(1) // Reset stage
    setShowPrompt(false)
    onClose()
  }

  const handlePromptResponse = (accepted: boolean) => {
    setShowPrompt(false)
    if (accepted && matchData) {
      promoteToMatch(matchData.partnerId)
      
      if (callStage === 1) {
        toast.success('Proceeding to Video Stage!')
        setCallStage(2)
      } else {
        toast.success('Exchanging Contacts...')
        setCallStage(3)
      }
      // Do NOT close. Seamless transition.
    } else {
      toast.info('Call ended')
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {showGuidance ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <ProfileGuidance 
              score={score} 
              missingFields={missingFields} 
              isLoading={isCheckingReadiness}
              onClose={() => {
                setShowGuidance(false)
                handleClose()
              }}
            />
            <button 
              onClick={handleClose}
              className="mt-4 w-full text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              Maybe Later
            </button>
          </motion.div>
        </div>
      ) : (
        <LiveCallQueueOverlay 
          status={status} 
          onCancel={handleClose} 
        />
      )}

      {/* Actual Call Modal - KEPT MOUNTED during transition */}
      {status === 'in-call' && matchData && callStage !== 3 && (
        <StagedAudioCallModal
          isOpen={true}
          channelName={matchData.channelName}
          partnerName={matchData.partnerName}
          remainingTime={remainingTime}
          stage={callStage as 1 | 2}
          isPaused={showPrompt} // Pass pause state
          onClose={handleClose}
          onCallEnded={() => setShowPrompt(true)} // Trigger prompt on end
        />
      )}

      {/* AI Wingman Icebreakers */}
      {status === 'in-call' && icebreaker && (
        <IcebreakerOverlay questions={icebreaker.questions} />
      )}

      {/* Stage 3 - Contact Reveal */}
      {callStage === 3 && matchData && partnerContact && exchangeExpiresAt && (
        <ContactExchangeModal
          isOpen={true}
          partnerName={matchData.partnerName}
          contactInfo={partnerContact}
          expiresAt={exchangeExpiresAt}
          onClose={handleClose}
        />
      )}

      {/* Promotion Prompt - Overlay on top */}
      <StagePromptModal
        isOpen={showPrompt}
        fromStage={callStage === 1 ? 1 : 2}
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

