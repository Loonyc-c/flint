'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import type {
  StagedCallRingingPayload,
  StagedCallAcceptedPayload,
  StagedCallEndedPayload,
  StagePromptPayload,
  StagePromptResult,
  ContactExchangePayload,
  ContactInfoDisplay,
} from '@shared/types'

// =============================================================================
// Types
// =============================================================================

export type StagedCallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'prompt'

export interface IncomingStagedCall {
  matchId: string
  callerId: string
  callerName: string
  channelName: string
  stage: 1 | 2
  callType: 'audio' | 'video'
}

interface UseStagedCallOptions {
  onIncomingCall?: (call: IncomingStagedCall) => void
  onCallAccepted?: (data: StagedCallAcceptedPayload) => void
  onCallEnded?: (data: StagedCallEndedPayload) => void
  onStagePrompt?: (data: StagePromptPayload) => void
  onPromptResult?: (data: StagePromptResult) => void
  onContactExchange?: (data: ContactExchangePayload) => void
}

interface UseStagedCallReturn {
  callStatus: StagedCallStatus
  currentCall: { matchId: string; channelName: string; stage: 1 | 2; duration: number } | null
  incomingCall: IncomingStagedCall | null
  remainingTime: number
  stagePrompt: StagePromptPayload | null
  partnerContact: ContactInfoDisplay | null
  initiateCall: (matchId: string, calleeId: string, stage: 1 | 2) => void
  acceptCall: (matchId: string) => void
  declineCall: (matchId: string) => void
  respondToPrompt: (matchId: string, accepted: boolean) => void
}

// =============================================================================
// Hook
// =============================================================================

export const useStagedCall = (options: UseStagedCallOptions = {}): UseStagedCallReturn => {
  const { socket, isConnected } = useSocket()
  const [callStatus, setCallStatus] = useState<StagedCallStatus>('idle')
  const [currentCall, setCurrentCall] = useState<UseStagedCallReturn['currentCall']>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingStagedCall | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [stagePrompt, setStagePrompt] = useState<StagePromptPayload | null>(null)
  const [partnerContact, setPartnerContact] = useState<ContactInfoDisplay | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start countdown timer
  const startTimer = useCallback((duration: number) => {
    setRemainingTime(duration)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1000) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1000
      })
    }, 1000)
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (!socket) return

    const handleRinging = (data: StagedCallRingingPayload) => {
      setIncomingCall(data)
      setCallStatus('ringing')
      options.onIncomingCall?.(data)
    }

    const handleWaiting = (data: { matchId: string; channelName: string; stage: 1 | 2 }) => {
      setCallStatus('calling')
      setCurrentCall({ ...data, duration: 0 })
    }

    const handleAccepted = (data: StagedCallAcceptedPayload) => {
      setCallStatus('active')
      setCurrentCall({ matchId: data.matchId, channelName: data.channelName, stage: data.stage, duration: data.duration })
      startTimer(data.duration)
      options.onCallAccepted?.(data)
    }

    const handleConnected = (data: StagedCallAcceptedPayload) => {
      setCallStatus('active')
      setCurrentCall({ matchId: data.matchId, channelName: data.channelName, stage: data.stage, duration: data.duration })
      setIncomingCall(null)
      startTimer(data.duration)
      options.onCallAccepted?.(data)
    }

    const handleDeclined = () => {
      setCallStatus('idle')
      setCurrentCall(null)
    }

    const handleEnded = (data: StagedCallEndedPayload) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setCallStatus(data.promptNextStage ? 'prompt' : 'idle')
      setCurrentCall(null)
      setIncomingCall(null)
      options.onCallEnded?.(data)
    }

    const handlePrompt = (data: StagePromptPayload) => {
      setStagePrompt(data)
      setCallStatus('prompt')
      options.onStagePrompt?.(data)
    }

    const handlePromptResult = (data: StagePromptResult) => {
      setStagePrompt(null)
      setCallStatus('idle')
      options.onPromptResult?.(data)
    }

    const handleContactExchange = (data: ContactExchangePayload) => {
      setPartnerContact(data.partnerContact)
      options.onContactExchange?.(data)
    }

    const handleTimeout = () => { setCallStatus('idle'); setCurrentCall(null) }
    const handleMissed = () => { setIncomingCall(null); setCallStatus('idle') }
    const handleCancelled = () => { setIncomingCall(null); setCallStatus('idle') }

    socket.on('staged-call-ringing', handleRinging)
    socket.on('staged-call-waiting', handleWaiting)
    socket.on('staged-call-accepted', handleAccepted)
    socket.on('staged-call-connected', handleConnected)
    socket.on('staged-call-declined', handleDeclined)
    socket.on('staged-call-ended', handleEnded)
    socket.on('staged-call-timeout', handleTimeout)
    socket.on('staged-call-missed', handleMissed)
    socket.on('staged-call-cancelled', handleCancelled)
    socket.on('stage-prompt', handlePrompt)
    socket.on('stage-prompt-result', handlePromptResult)
    socket.on('contact-exchange', handleContactExchange)

    return () => {
      socket.off('staged-call-ringing', handleRinging)
      socket.off('staged-call-waiting', handleWaiting)
      socket.off('staged-call-accepted', handleAccepted)
      socket.off('staged-call-connected', handleConnected)
      socket.off('staged-call-declined', handleDeclined)
      socket.off('staged-call-ended', handleEnded)
      socket.off('staged-call-timeout', handleTimeout)
      socket.off('staged-call-missed', handleMissed)
      socket.off('staged-call-cancelled', handleCancelled)
      socket.off('stage-prompt', handlePrompt)
      socket.off('stage-prompt-result', handlePromptResult)
      socket.off('contact-exchange', handleContactExchange)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [socket, options, startTimer])

  const initiateCall = useCallback((matchId: string, calleeId: string, stage: 1 | 2) => {
    if (socket && isConnected && callStatus === 'idle') {
      socket.emit('staged-call-initiate', { matchId, calleeId, stage })
    }
  }, [socket, isConnected, callStatus])

  const acceptCall = useCallback((matchId: string) => {
    if (socket && isConnected && incomingCall) {
      socket.emit('staged-call-accept', { matchId })
    }
  }, [socket, isConnected, incomingCall])

  const declineCall = useCallback((matchId: string) => {
    if (socket && isConnected) {
      socket.emit('staged-call-decline', { matchId })
      setIncomingCall(null)
      setCallStatus('idle')
    }
  }, [socket, isConnected])

  const respondToPrompt = useCallback((matchId: string, accepted: boolean) => {
    if (socket && isConnected) {
      socket.emit('stage-prompt-response', { matchId, accepted })
    }
  }, [socket, isConnected])

  return {
    callStatus, currentCall, incomingCall, remainingTime,
    stagePrompt, partnerContact, initiateCall, acceptCall, declineCall, respondToPrompt,
  }
}
