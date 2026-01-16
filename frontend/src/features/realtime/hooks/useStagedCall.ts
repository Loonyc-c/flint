'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useUser } from '@/features/auth/context/UserContext'
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

export interface IcebreakerPayload {
  matchId: string
  questions: string[]
  timestamp: string
}

interface UseStagedCallOptions {
  onIncomingCall?: (call: IncomingStagedCall) => void
  onCallAccepted?: (data: StagedCallAcceptedPayload) => void
  onCallDeclined?: (data: { matchId: string }) => void
  onCallEnded?: (data: StagedCallEndedPayload) => void
  onStagePrompt?: (data: StagePromptPayload) => void
  onPromptResult?: (data: StagePromptResult) => void
  onContactExchange?: (data: ContactExchangePayload) => void
  onIcebreaker?: (data: IcebreakerPayload) => void
}

interface UseStagedCallReturn {
  callStatus: StagedCallStatus
  currentCall: { matchId: string; channelName: string; stage: 1 | 2; duration: number } | null
  incomingCall: IncomingStagedCall | null
  remainingTime: number
  stagePrompt: StagePromptPayload | null
  partnerContact: ContactInfoDisplay | null
  icebreaker: IcebreakerPayload | null
  initiateCall: (matchId: string, calleeId: string, stage: 1 | 2) => void
  acceptCall: (matchId: string) => void
  declineCall: (matchId: string) => void
  endCall: (matchId: string) => void
  respondToPrompt: (matchId: string, accepted: boolean) => void
}

// =============================================================================
// Hook
// =============================================================================

export const useStagedCall = (options: UseStagedCallOptions = {}): UseStagedCallReturn => {
  const { user } = useUser()
  const { socket, isConnected, busyStates } = useSocket()
  const [callStatus, setCallStatus] = useState<StagedCallStatus>('idle')
  const [currentCall, setCurrentCall] = useState<UseStagedCallReturn['currentCall']>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingStagedCall | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [stagePrompt, setStagePrompt] = useState<StagePromptPayload | null>(null)
  const [partnerContact, setPartnerContact] = useState<ContactInfoDisplay | null>(null)
  const [icebreaker, setIcebreaker] = useState<IcebreakerPayload | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use ref to track callStatus immediately (avoids stale closure issues)
  const callStatusRef = useRef<StagedCallStatus>(callStatus)
  callStatusRef.current = callStatus

  // Start countdown timer
  const startTimer = useCallback((duration: number) => {
    setRemainingTime(duration)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
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
      // Auto-reject only if already in an active call
      const isActuallyBusy = user?.id ? (busyStates[user.id] === 'in-call') : false
      
      if (callStatusRef.current === 'active' || isActuallyBusy) {
        socket.emit('staged-call-decline', { matchId: data.matchId })
        return
      }
      
      setIncomingCall(data)
      setCallStatus('ringing')
      callStatusRef.current = 'ringing'
      options.onIncomingCall?.(data)
    }

    const handleWaiting = (data: { matchId: string; channelName: string; stage: 1 | 2 }) => {
      setCallStatus('calling')
      callStatusRef.current = 'calling'
      setCurrentCall({ ...data, duration: 0 })
    }

    const handleAccepted = (data: StagedCallAcceptedPayload) => {
      setCallStatus('active')
      callStatusRef.current = 'active'
      setCurrentCall({ matchId: data.matchId, channelName: data.channelName, stage: data.stage, duration: data.duration })
      startTimer(data.duration)
      options.onCallAccepted?.(data)
    }

    const handleConnected = (data: StagedCallAcceptedPayload) => {
      setCallStatus('active')
      callStatusRef.current = 'active'
      setCurrentCall({ matchId: data.matchId, channelName: data.channelName, stage: data.stage, duration: data.duration })
      setIncomingCall(null)
      startTimer(data.duration)
      options.onCallAccepted?.(data)
    }

    const handleDeclined = (data: { matchId: string }) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setCallStatus('idle')
      callStatusRef.current = 'idle'
      setCurrentCall(null)
      setIncomingCall(null)
      setIcebreaker(null)
      setRemainingTime(0)
      options.onCallDeclined?.(data)
    }

    const handleEnded = (data: StagedCallEndedPayload) => {
      if (timerRef.current) clearInterval(timerRef.current)
      const newStatus = data.promptNextStage ? 'prompt' : 'idle'
      setCallStatus(newStatus)
      callStatusRef.current = newStatus
      setCurrentCall(null)
      setIncomingCall(null)
      setIcebreaker(null)
      setRemainingTime(0)
      options.onCallEnded?.(data)
    }

    const handlePrompt = (data: StagePromptPayload) => {
      setStagePrompt(data)
      setCallStatus('prompt')
      callStatusRef.current = 'prompt'
      setIcebreaker(null) // Clear icebreaker during prompt
      options.onStagePrompt?.(data)
    }

    const handlePromptResult = (data: StagePromptResult) => {
      setStagePrompt(null)
      setCallStatus('idle')
      // Update ref immediately so initiateCall can use the new value
      callStatusRef.current = 'idle'
      setIcebreaker(null)
      options.onPromptResult?.(data)
    }

    const handleContactExchange = (data: ContactExchangePayload) => {
      setPartnerContact(data.partnerContact)
      setIcebreaker(null)
      options.onContactExchange?.(data)
    }

    const handleIcebreaker = (data: IcebreakerPayload) => {
      setIcebreaker(data)
      options.onIcebreaker?.(data)
    }

    const handleTimeout = () => { setCallStatus('idle'); callStatusRef.current = 'idle'; setCurrentCall(null); setIcebreaker(null) }
    const handleMissed = () => { setIncomingCall(null); setCallStatus('idle'); callStatusRef.current = 'idle'; setIcebreaker(null) }
    const handleCancelled = () => { setIncomingCall(null); setCallStatus('idle'); callStatusRef.current = 'idle'; setIcebreaker(null) }

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
    socket.on('staged-call-icebreaker', handleIcebreaker)

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
      socket.off('staged-call-icebreaker', handleIcebreaker)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [socket, options, startTimer, busyStates, user?.id])

  const initiateCall = useCallback((matchId: string, calleeId: string, stage: 1 | 2) => {
    // Use ref for immediate status check (avoids stale closure from React state)
    const currentStatus = callStatusRef.current
    if (socket && isConnected && currentStatus === 'idle') {
      socket.emit('staged-call-initiate', { matchId, calleeId, stage })
    } else {
    }
  }, [socket, isConnected])

  const acceptCall = useCallback((matchId: string) => {
    if (socket && isConnected && incomingCall) {
      socket.emit('staged-call-accept', { matchId })
    }
  }, [socket, isConnected, incomingCall])

  const declineCall = useCallback((matchId: string) => {
    if (socket && isConnected) {
      socket.emit('staged-call-decline', { matchId })
      if (timerRef.current) clearInterval(timerRef.current)
      setIncomingCall(null)
      setCallStatus('idle')
      callStatusRef.current = 'idle'
      setRemainingTime(0)
    }
  }, [socket, isConnected])

  const endCall = useCallback((matchId: string) => {
    if (socket && isConnected) {
      socket.emit('staged-call-end', { matchId })
      if (timerRef.current) clearInterval(timerRef.current)
      setCallStatus('idle')
      callStatusRef.current = 'idle'
      setCurrentCall(null)
      setRemainingTime(0)
    }
  }, [socket, isConnected])

  const respondToPrompt = useCallback((matchId: string, accepted: boolean) => {
    if (socket && isConnected) {
      socket.emit('stage-prompt-response', { matchId, accepted })
    }
  }, [socket, isConnected])

  return {
    callStatus, currentCall, incomingCall, remainingTime,
    stagePrompt, partnerContact, icebreaker, initiateCall, acceptCall, declineCall, endCall, respondToPrompt,
  }
}
