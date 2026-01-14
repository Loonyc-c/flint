'use client'

import { useEffect, useCallback, useState } from 'react'
import { useSocket } from '@/features/realtime/context/SocketContext'

export type LiveCallStatus = 'idle' | 'queueing' | 'connecting' | 'in-call' | 'error'

interface LiveMatchData {
  matchId: string
  partnerId: string
  partnerName: string
  channelName: string
  stage: number
  callType: string
}

interface UseLiveCallReturn {
  status: LiveCallStatus
  matchData: LiveMatchData | null
  error: string | null
  joinQueue: () => void
  leaveQueue: () => void
  promoteToMatch: (partnerId: string) => void
  reset: () => void
}

export const useLiveCall = (): UseLiveCallReturn => {
  const { socket, isConnected } = useSocket()
  const [status, setStatus] = useState<LiveCallStatus>('idle')
  const [matchData, setMatchData] = useState<LiveMatchData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleQueued = () => {
      setStatus('queueing')
    }

    const handleMatchFound = (data: LiveMatchData) => {
      setMatchData(data)
      setStatus('connecting')
      // Small delay to simulate connecting or allow UI to transition
      setTimeout(() => {
        setStatus('in-call')
      }, 1500)
    }

    const handleError = (data: { message: string }) => {
      setError(data.message)
      setStatus('error')
    }

    const handleLeft = () => {
      setStatus('idle')
    }

    const handlePromoted = (data: { matchId: string }) => {
      console.warn('Match promoted successfully:', data.matchId)
    }

    socket.on('live-call-queued', handleQueued)
    socket.on('live-match-found', handleMatchFound)
    socket.on('live-call-error', handleError)
    socket.on('live-call-left', handleLeft)
    socket.on('live-call-match-promoted', handlePromoted)

    return () => {
      socket.off('live-call-queued', handleQueued)
      socket.off('live-match-found', handleMatchFound)
      socket.off('live-call-error', handleError)
      socket.off('live-call-left', handleLeft)
      socket.off('live-call-match-promoted', handlePromoted)
    }
  }, [socket])

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
    setError(null)
  }, [])

  return {
    status,
    matchData,
    error,
    joinQueue,
    leaveQueue,
    promoteToMatch,
    reset
  }
}
