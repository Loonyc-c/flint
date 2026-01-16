'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useSocket } from '@/features/realtime/context/SocketContext'
import { LIVE_CALL_EVENTS, LiveCallMatchPayload, LiveCallPreferences } from '@shared/types'
import { useUser } from '@/features/auth/context/UserContext'
import { agoraClient } from '@/features/video/lib/agora-client'

export type LiveCallStatus = 'idle' | 'queueing' | 'connecting' | 'in-call' | 'error' | 'ended'

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
  const [status, setStatus] = useState<LiveCallStatus>('idle')
  const [matchData, setMatchData] = useState<LiveCallMatchPayload | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasPassed, setHasPassed] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    await agoraClient.leave()
    setStatus('ended')
  }, [])

  useEffect(() => {
    if (!socket) return

    const onMatchFound = async (
      data: LiveCallMatchPayload & { agoraToken?: string; agoraUid?: number }
    ) => {
      console.log('🎤 [LiveCall] Match found, connecting to Agora...', data)

      setMatchData(data)
      setStatus('connecting')
      setError(null)
      setHasLiked(false)
      setHasPassed(false)

      try {
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
        if (!appId) throw new Error('Agora App ID not configured')
        if (!data.agoraToken) throw new Error('Agora token missing from match payload')
        if (!data.channelName) throw new Error('Channel name missing from match payload')

        await agoraClient.init()

        const result = await agoraClient.join({
          appId,
          channel: data.channelName,
          token: data.agoraToken,
          uid: data.agoraUid || 0, // Use the UID from backend or let Agora assign
          enableVideo: false
        })

        if (!result.success) throw new Error(result.message || 'Failed to join Agora channel')

        console.log('✅ [LiveCall] Successfully connected to Agora channel')
        setStatus('in-call')

        // Start timer
        const expiry = new Date(data.expiresAt).getTime()
        const startTimer = () => {
          const now = Date.now()
          const diff = Math.max(0, Math.floor((expiry - now) / 1000))
          setRemainingTime(diff)
          if (diff <= 0) {
            if (timerRef.current) clearInterval(timerRef.current)
            endCall()
          }
        }
        startTimer()
        timerRef.current = setInterval(startTimer, 1000)
      } catch (err: unknown) {
        console.error('❌ [LiveCall] Connection failed:', err)
        setError('err.live_call.connection_failed')
        setStatus('error')
      }
    }

    const onCallResult = (data: { isMatch: boolean; newMatchId?: string }) => {
      console.log('✨ [LiveCall] Call result:', data)
      if (data.isMatch) {
        // Success feedback can be handled by UI
      }
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
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [socket, endCall])

  const joinQueue = useCallback(
    (preferences?: LiveCallPreferences) => {
      if (!socket || !isConnected) return
      console.log('🔍 [LiveCall] Joining queue...')
      socket.emit(LIVE_CALL_EVENTS.JOIN_QUEUE, preferences)
      setStatus('queueing')
      setError(null)
    },
    [socket, isConnected]
  )

  const leaveQueue = useCallback(() => {
    if (!socket || !isConnected) return
    console.log('👋 [LiveCall] Leaving queue...')
    socket.emit(LIVE_CALL_EVENTS.LEAVE_QUEUE)
    setStatus('idle')
  }, [socket, isConnected])

  const performAction = useCallback(
    (action: 'like' | 'pass') => {
      if (!socket || !isConnected || !matchData) return
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
    console.log('🔄 [LiveCall] Resetting...')
    setStatus('idle')
    setMatchData(null)
    setRemainingTime(0)
    setError(null)
    setHasLiked(false)
    setHasPassed(false)
    if (timerRef.current) clearInterval(timerRef.current)
    agoraClient.leave().catch(console.error)
  }, [])

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
