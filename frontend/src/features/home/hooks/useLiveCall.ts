'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useSocket } from '@/features/realtime/context/SocketContext'
import { type ContactInfoDisplay } from '@shared/types'
import { useUser } from '@/features/auth/context/UserContext'
import { type LiveMatchData, type IcebreakerPayload } from '../types'

export type LiveCallStatus = 'idle' | 'queueing' | 'connecting' | 'in-call' | 'error'

interface UseLiveCallReturn {
  status: LiveCallStatus
  matchData: LiveMatchData | null
  partnerContact: ContactInfoDisplay | null
  exchangeExpiresAt: string | null
  icebreaker: IcebreakerPayload | null
  error: string | null
  joinQueue: () => void
  leaveQueue: () => void
  promoteToMatch: (partnerId: string) => void
  reset: () => void
}

export const useLiveCall = (): UseLiveCallReturn => {
  const { user } = useUser()
  const { socket, isConnected, busyStates } = useSocket()
  const [status, setStatus] = useState<LiveCallStatus>('idle')
  const statusRef = useRef(status)

  // Sync ref with state
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const [matchData, setMatchData] = useState<LiveMatchData | null>(null)
  const [partnerContact, setPartnerContact] = useState<ContactInfoDisplay | null>(null)
  const [exchangeExpiresAt, setExchangeExpiresAt] = useState<string | null>(null)
  const [icebreaker, setIcebreaker] = useState<IcebreakerPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Track mounting state to prevent updates after unmount
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      // Re-join queue if we were queueing before disconnect
      if (statusRef.current === 'queueing') {
        socket.emit('live-call-join')
      }
    }

    const handleQueued = () => {
      setStatus('queueing')
    }

    const handleMatchFound = (data: LiveMatchData) => {
      // Auto-reject only if we are already in an active call session.
      // We allow the match if we are idle or queueing.
      const isAlreadyInCall = statusRef.current === 'in-call' || statusRef.current === 'connecting'
      
      // Check global busy state (from other matches, not this one)
      const isUserGloballyBusy = user?.id ? (busyStates[user.id] === 'in-call') : false

      if (isAlreadyInCall || isUserGloballyBusy) {
        socket.emit('staged-call-decline', { matchId: data.matchId })
        return
      }

      setMatchData(data)
      setStatus('connecting')
      // Small delay to simulate connecting or allow UI to transition
      setTimeout(() => {
        if (isMounted.current && statusRef.current !== 'idle') {
           setStatus('in-call')
        }
      }, 1500)
    }

    const handleError = (data: { message: string }) => {
      setError(data.message)
      setStatus('error')
    }

    const handleLeft = () => {
      setStatus('idle')
    }

    const handlePromoted = (_data: { matchId: string }) => {
      // Success logged internally if needed
    }

    const handleContactExchange = (data: { partnerContact: ContactInfoDisplay, expiresAt: string }) => {
      setPartnerContact(data.partnerContact)
      setExchangeExpiresAt(data.expiresAt)
    }

    const handlePromptResult = (data: { bothAccepted: boolean, nextStage: number | null }) => {
      if (!data.bothAccepted && statusRef.current === 'in-call') {
        // If someone declined the transition to Stage 2 or 3
        setStatus('idle')
        setMatchData(null)
      }
    }

    const handleIcebreaker = (data: IcebreakerPayload) => {
      setIcebreaker(data)
    }

    socket.on('connect', handleConnect)
    socket.on('live-call-queued', handleQueued)
    socket.on('live-match-found', handleMatchFound)
    socket.on('live-call-error', handleError)
    socket.on('live-call-left', handleLeft)
    socket.on('live-call-match-promoted', handlePromoted)
    socket.on('contact-exchange', handleContactExchange)
    socket.on('stage-prompt-result', handlePromptResult)
    socket.on('staged-call-icebreaker', handleIcebreaker)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('live-call-queued', handleQueued)
      socket.off('live-match-found', handleMatchFound)
      socket.off('live-call-error', handleError)
      socket.off('live-call-left', handleLeft)
      socket.off('live-call-match-promoted', handlePromoted)
      socket.off('contact-exchange', handleContactExchange)
      socket.off('stage-prompt-result', handlePromptResult)
      socket.off('staged-call-icebreaker', handleIcebreaker)
    }
  }, [socket, busyStates, user?.id])

  const joinQueue = useCallback(() => {
    if (socket && isConnected) {
      setError(null)
      socket.emit('live-call-join')
    }
  }, [socket, isConnected])

  const leaveQueue = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('live-call-leave')
    }
  }, [socket, isConnected])

  const promoteToMatch = useCallback((partnerId: string) => {
    if (socket && isConnected) {
      socket.emit('live-call-promote-match', { partnerId })
    }
  }, [socket, isConnected])

  const reset = useCallback(() => {
    setStatus('idle')
    setMatchData(null)
    setPartnerContact(null)
    setExchangeExpiresAt(null)
    setIcebreaker(null)
    setError(null)
  }, [])

  return {
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
  }
}