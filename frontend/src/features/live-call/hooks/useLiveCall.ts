'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useSocket } from '@/features/realtime'
import { LIVE_CALL_EVENTS } from '@shared/types'
import type { LiveCallMatchPayload, LiveCallPreferences } from '@shared/types'
import { useUser } from '@/features/auth/context/UserContext'
import { useCallSystem } from '@/features/call-system'

export type LiveCallStatus = 'idle' | 'queueing' | 'connecting' | 'in-call' | 'error' | 'ended'

// Note: RemainingTime and matchData are now primarily managed by UnifiedCallInterface
// but we keep some local state for queueing status.

interface UseLiveCallReturn {
  status: LiveCallStatus
  matchData: LiveCallMatchPayload | null
  remainingTime: number
  error: string | null
  hasLiked: boolean
  hasPassed: boolean
  joinQueue: (preferences?: LiveCallPreferences) => void
  leaveQueue: () => void
  performAction: (action: 'like' | 'pass') => void
  endCall: () => void
  reset: () => void
}

export const useLiveCall = (): UseLiveCallReturn => {
  const { user: _user } = useUser()
  const { socket, isConnected } = useSocket()
  const { startCall, closeCall } = useCallSystem()

  const [status, setStatus] = useState<LiveCallStatus>('idle')
  const [matchData, setMatchData] = useState<LiveCallMatchPayload | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasPassed, setHasPassed] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    closeCall()
    setStatus('ended')
  }, [closeCall])

  useEffect(() => {
    if (!socket) return

    const onMatchFound = async (
      data: LiveCallMatchPayload & { agoraToken?: string; agoraUid?: number }
    ) => {
      // eslint-disable-next-line no-console
      console.log('🎤 [LiveCall] Match found, triggering unified UI...', data)

      setMatchData(data)
      setStatus('connecting')
      setError(null)
      setHasLiked(false)
      setHasPassed(false)

      // Delegate to UnifiedCallInterface
      startCall({
        callType: 'live',
        matchId: data.matchId,
        channelName: data.channelName,
        partnerInfo: {
          id: data.partner.id,
          name: data.partner.nickName,
          avatar: data.partner.photo
        },
        remainingTime: Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
      })

      setStatus('in-call')
    }

    const onCallResult = (data: { isMatch: boolean; newMatchId?: string }) => {
      // eslint-disable-next-line no-console
      console.log('✨ [LiveCall] Call result:', data)
    }

    const onError = (data: { message: string }) => {
      console.error('❌ [LiveCall] Error:', data.message)
      setError(data.message)
      setStatus('error')
    }

    socket.on(LIVE_CALL_EVENTS.MATCH_FOUND, onMatchFound)
    socket.on(LIVE_CALL_EVENTS.CALL_RESULT, onCallResult)
    socket.on(LIVE_CALL_EVENTS.ERROR, onError)

    return () => {
      socket.off(LIVE_CALL_EVENTS.MATCH_FOUND, onMatchFound)
      socket.off(LIVE_CALL_EVENTS.CALL_RESULT, onCallResult)
      socket.off(LIVE_CALL_EVENTS.ERROR, onError)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [socket, startCall])

  const joinQueue = useCallback(
    (preferences?: LiveCallPreferences) => {
      if (!socket || !isConnected) return
      // eslint-disable-next-line no-console
      console.log('🔍 [LiveCall] Joining queue...')
      socket.emit(LIVE_CALL_EVENTS.JOIN_QUEUE, preferences)
      setStatus('queueing')
      setError(null)
    },
    [socket, isConnected]
  )

  const leaveQueue = useCallback(() => {
    if (!socket || !isConnected) return
    // eslint-disable-next-line no-console
    console.log('👋 [LiveCall] Leaving queue...')
    socket.emit(LIVE_CALL_EVENTS.LEAVE_QUEUE)
    setStatus('idle')
  }, [socket, isConnected])

  const performAction = useCallback(
    (action: 'like' | 'pass') => {
      if (!socket || !isConnected || !matchData) return
      // eslint-disable-next-line no-console
      console.log(`👍 [LiveCall] Performing action: ${action}`)
      socket.emit(LIVE_CALL_EVENTS.CALL_ACTION, {
        matchId: matchData.matchId,
        action
      })
      if (action === 'like') setHasLiked(true)
      else setHasPassed(true)
    },
    [socket, isConnected, matchData]
  )

  const reset = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🔄 [LiveCall] Resetting...')
    setStatus('idle')
    setMatchData(null)
    setRemainingTime(0)
    setError(null)
    setHasLiked(false)
    setHasPassed(false)
    if (timerRef.current) clearInterval(timerRef.current)
    closeCall()
  }, [closeCall])

  return {
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
  }
}

