'use client'

import { useCallback, useState, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useUser } from '@/features/auth/context/UserContext'
import type {
  StagePromptPayload,
  ContactInfoDisplay
} from '@shared/types'

import type {
  StagedCallStatus,
  UseStagedCallOptions,
  IncomingStagedCall,
  IcebreakerPayload,
  UseStagedCallReturn
} from '../types/staged-call'

export type {
  StagedCallStatus,
  UseStagedCallOptions,
  IncomingStagedCall,
  IcebreakerPayload,
  UseStagedCallReturn
} from '../types/staged-call'

import { useCallTimer } from './useCallTimer'
import { useStagedCallEvents } from './useStagedCallEvents'

// =============================================================================
// Hook
// =============================================================================

export const useStagedCall = (options: UseStagedCallOptions = {}): UseStagedCallReturn => {
  const { user } = useUser()
  const { socket, isConnected, busyStates } = useSocket()

  // State
  const [callStatus, setCallStatus] = useState<StagedCallStatus>('idle')
  const [currentCall, setCurrentCall] = useState<UseStagedCallReturn['currentCall']>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingStagedCall | null>(null)
  const [stagePrompt, setStagePrompt] = useState<StagePromptPayload | null>(null)
  const [partnerContact, setPartnerContact] = useState<ContactInfoDisplay | null>(null)
  const [icebreaker, setIcebreaker] = useState<IcebreakerPayload | null>(null)

  // Timer Hook
  const { remainingTime, startTimer, setRemainingTime } = useCallTimer()

  // Refs for immediate checks
  const callStatusRef = useRef<StagedCallStatus>(callStatus)
  const joiningRef = useRef(false)
  callStatusRef.current = callStatus

  // Cleanup
  const cleanupCall = useCallback(() => {
    joiningRef.current = false
    setRemainingTime(0)
    setCurrentCall(null)
    setIncomingCall(null)
    setIcebreaker(null)
    setStagePrompt(null)
  }, [setRemainingTime])

  // Event Listeners
  useStagedCallEvents({
    socket,
    user,
    busyStates,
    options,
    startTimer,
    cleanupCall,
    setIncomingCall,
    setCallStatus,
    setCurrentCall,
    setStagePrompt,
    setPartnerContact,
    setIcebreaker,
    callStatusRef,
    joiningRef
  })

  // Actions
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

