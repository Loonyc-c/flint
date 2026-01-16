'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'
import { StagedAudioCallModal, StagePromptModal, ContactExchangeModal } from '@/features/video/components/staged'
import { IcebreakerOverlay } from './IcebreakerOverlay'
import { type ContactInfoDisplay } from '@shared/types'

interface LiveCallSessionProps {
  status: string
  matchData: any
  icebreaker: any
  partnerContact: ContactInfoDisplay | null
  exchangeExpiresAt: string | null
  onPromote: (matchId: string, partnerId: string) => void
  onClose: () => void
}

export const LiveCallSession = ({
  status,
  matchData,
  icebreaker,
  partnerContact,
  exchangeExpiresAt,
  onPromote,
  onClose,
}: LiveCallSessionProps) => {
  const t = useTranslations('home.findMatch.liveCall')
  const tv = useTranslations('video.staged')
  
  const [remainingTime, setRemainingTime] = useState(90000)
  const [showPrompt, setShowPrompt] = useState(false)
  const [callStage, setCallStage] = useState<1 | 3>(1)

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (status === 'in-call' && callStage === 1) {
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
  }, [status, callStage])

  // Handle successful promotion to Stage 3
  useEffect(() => {
    if (partnerContact && exchangeExpiresAt && status === 'in-call') {
      setCallStage(3)
      toast.success(t('matchCreated'))
    }
  }, [partnerContact, exchangeExpiresAt, status, t])

  const handlePromptResponse = (accepted: boolean) => {
    setShowPrompt(false)
    if (accepted && matchData) {
      onPromote(matchData.matchId, matchData.partnerId)
      toast.info(tv('prompt.waiting'))
    } else {
      toast.info(t('callEnded'))
      onClose()
    }
  }

  if (status !== 'in-call' || !matchData) return null

  return (
    <>
      {callStage === 1 && (
        <StagedAudioCallModal
          isOpen={true}
          channelName={matchData.channelName}
          partnerName={matchData.partnerName}
          remainingTime={remainingTime}
          stage={1}
          isPaused={showPrompt}
          onClose={onClose}
          onCallEnded={() => setShowPrompt(true)}
        />
      )}

      {icebreaker && <IcebreakerOverlay questions={icebreaker.questions} />}

      {callStage === 3 && partnerContact && exchangeExpiresAt && (
        <ContactExchangeModal
          isOpen={true}
          partnerName={matchData.partnerName}
          contactInfo={partnerContact}
          expiresAt={exchangeExpiresAt}
          onClose={onClose}
        />
      )}

      <StagePromptModal
        isOpen={showPrompt}
        fromStage={2}
        expiresAt={new Date(Date.now() + 10000).toISOString()}
        onAccept={() => handlePromptResponse(true)}
        onDecline={() => handlePromptResponse(false)}
      />
    </>
  )
}
