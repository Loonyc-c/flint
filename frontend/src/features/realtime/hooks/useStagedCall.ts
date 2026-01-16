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
  ContactInfoDisplay
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

  // FIXED: Refs for immediate checks
  const callStatusRef = useRef<StagedCallStatus>(callStatus)
  const joiningRef = useRef(false) // NEW: Prevent duplicate Agora joins
  callStatusRef.current = callStatus

  // FIXED: Enhanced cleanup
  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    joiningRef.current = false
    setRemainingTime(0)
    setCurrentCall(null)
    setIncomingCall(null)
    setIcebreaker(null)
    setStagePrompt(null)
  }, [])

  const startTimer = useCallback((duration: number) => {
    setRemainingTime(duration)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1000) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1000
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleRinging = (data: StagedCallRingingPayload) => {
      const isActuallyBusy = user?.id ? busyStates[user.id] === 'in-call' : false

      if (callStatusRef.current === 'active' || isActuallyBusy) {
        socket.emit('staged-call-decline', { matchId: data.matchId })
        return
      }

      setIncomingCall(data)
      setCallStatus('ringing')
      callStatusRef.current = 'ringing'
      options.onIncomingCall?.(data)
    }

    // FIXED: Unified connected handler with guard
    const handleConnected = (data: StagedCallAcceptedPayload) => {
      if (joiningRef.current || callStatusRef.current === 'active') {
        console.log('Duplicate connected ignored')
        return
      }
      joiningRef.current = true

      setCallStatus('active')
      callStatusRef.current = 'active'
      setCurrentCall({
        matchId: data.matchId,
        channelName: data.channelName,
        stage: data.stage,
        duration: data.duration
      })
      setIncomingCall(null)
      startTimer(data.duration)
      options.onCallAccepted?.(data)
      // HERE: Your Agora joinChannel(token, channelName, uid, options)
    }

    const handleDeclined = (data: { matchId: string }) => {
      cleanupCall()
      setCallStatus('idle')
      callStatusRef.current = 'idle'
      options.onCallDeclined?.(data)
    }

    const handleEnded = (data: StagedCallEndedPayload) => {
      cleanupCall()
      const newStatus = data.promptNextStage ? 'prompt' : 'idle'
      setCallStatus(newStatus)
      callStatusRef.current = newStatus
      options.onCallEnded?.(data)
    }

    // ... (other handlers unchanged: handleWaiting, handlePrompt, etc.)

    const handleWaiting = (data: { matchId: string; channelName: string; stage: 1 | 2 }) => {
      setCallStatus('calling')
      callStatusRef.current = 'calling'
      setCurrentCall({ ...data, duration: 0 })
    }

    const handlePrompt = (data: StagePromptPayload) => {
      setStagePrompt(data)
      setCallStatus('prompt')
      callStatusRef.current = 'prompt'
      setIcebreaker(null)
      options.onStagePrompt?.(data)
    }

    const handlePromptResult = (data: StagePromptResult) => {
      setStagePrompt(null)
      setCallStatus('idle')
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

    const handleTimeout = () => {
      cleanupCall()
      setCallStatus('idle')
      callStatusRef.current = 'idle'
    }
    const handleMissed = () => {
      cleanupCall()
      setCallStatus('idle')
      callStatusRef.current = 'idle'
    }
    const handleCancelled = () => {
      cleanupCall()
      setCallStatus('idle')
      callStatusRef.current = 'idle'
    }

    // FIXED: Single 'connected' listener (removed duplicate 'accepted')
    socket.on('staged-call-ringing', handleRinging)
    socket.on('staged-call-waiting', handleWaiting)
    socket.on('staged-call-connected', handleConnected) // Unified
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
      // ... (off all listeners)
      socket.off('staged-call-ringing', handleRinging)
      socket.off('staged-call-waiting', handleWaiting)
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
      cleanupCall()
    }
  }, [socket, options, startTimer, busyStates, user?.id, cleanupCall])

  const initiateCall = useCallback(
    (matchId: string, calleeId: string, stage: 1 | 2) => {
      if (socket && isConnected && callStatusRef.current === 'idle') {
        socket.emit('staged-call-initiate', { matchId, calleeId, stage })
      }
    },
    [socket, isConnected]
  )

  const acceptCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected && incomingCall) {
        socket.emit('staged-call-accept', { matchId })
      }
    },
    [socket, isConnected, incomingCall]
  )

  const declineCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected) {
        socket.emit('staged-call-decline', { matchId })
        cleanupCall()
        setCallStatus('idle')
        callStatusRef.current = 'idle'
      }
    },
    [socket, isConnected, cleanupCall]
  )

  const endCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected && currentCall) {
        socket.emit('staged-call-end', { matchId })
        // FIXED: Explicit Agora cleanup (add your client.leave())
        // agoraClient?.leaveChannel()
        cleanupCall()
        setCallStatus('idle')
        callStatusRef.current = 'idle'
      }
    },
    [socket, isConnected, currentCall, cleanupCall]
  )

  const respondToPrompt = useCallback(
    (matchId: string, accepted: boolean) => {
      if (socket && isConnected) {
        socket.emit('stage-prompt-response', { matchId, accepted })
      }
    },
    [socket, isConnected]
  )

  return {
    callStatus,
    currentCall,
    incomingCall,
    remainingTime,
    stagePrompt,
    partnerContact,
    icebreaker,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    respondToPrompt
  }
}
