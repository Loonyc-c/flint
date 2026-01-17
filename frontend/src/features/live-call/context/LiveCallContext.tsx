'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useSocket } from '@/features/realtime'
import { LIVE_CALL_EVENTS } from '@shared/types'
import type { LiveCallMatchPayload, LiveCallPreferences } from '@shared/types'
import { useCallSystem } from '@/features/call-system'

// Note: We use the shared type for LiveCallStatus if available, otherwise define it locally
export type LiveCallStatus = 'idle' | 'queueing' | 'connecting' | 'in-call' | 'error' | 'ended'

interface LiveCallContextValue {
    status: LiveCallStatus
    matchData: LiveCallMatchPayload | null
    error: string | null
    joinQueue: (preferences?: LiveCallPreferences) => void
    leaveQueue: () => void
    reset: () => void
    setStatus: (status: LiveCallStatus) => void
}

const LiveCallContext = createContext<LiveCallContextValue | null>(null)

export const LiveCallProvider = ({ children }: { children: ReactNode }) => {
    const { socket, isConnected } = useSocket()
    const { startCall, closeCall } = useCallSystem()

    const [status, setStatus] = useState<LiveCallStatus>('idle')
    const [matchData, setMatchData] = useState<LiveCallMatchPayload | null>(null)
    const [error, setError] = useState<string | null>(null)

    const joinQueue = useCallback((preferences?: LiveCallPreferences) => {
        if (!socket || !isConnected) return
        console.log('🔍 [LiveCall] Joining queue...')
        socket.emit(LIVE_CALL_EVENTS.JOIN_QUEUE, preferences)
        setStatus('queueing')
        setError(null)
    }, [socket, isConnected])

    const leaveQueue = useCallback(() => {
        if (!socket || !isConnected) return
        console.log('👋 [LiveCall] Leaving queue...')
        socket.emit(LIVE_CALL_EVENTS.LEAVE_QUEUE)
        setStatus('idle')
    }, [socket, isConnected])

    const reset = useCallback(() => {
        console.log('🔄 [LiveCall] Resetting...')
        setStatus('idle')
        setMatchData(null)
        setError(null)
        closeCall()
    }, [closeCall])

    useEffect(() => {
        if (!socket) return

        const onMatchFound = async (
            data: LiveCallMatchPayload & { agoraToken?: string; agoraUid?: number }
        ) => {
            console.log('🎤 [LiveCall] Match found, triggering unified UI...', data)
            setMatchData(data)
            setStatus('in-call')

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
        }

        const onError = (data: { message: string }) => {
            console.error('❌ [LiveCall] Error:', data.message)
            setError(data.message)
            setStatus('error')
        }

        socket.on(LIVE_CALL_EVENTS.MATCH_FOUND, onMatchFound)
        socket.on(LIVE_CALL_EVENTS.ERROR, onError)

        return () => {
            socket.off(LIVE_CALL_EVENTS.MATCH_FOUND, onMatchFound)
            socket.off(LIVE_CALL_EVENTS.ERROR, onError)
        }
    }, [socket, startCall])

    return (
        <LiveCallContext.Provider value={{ status, matchData, error, joinQueue, leaveQueue, reset, setStatus }}>
            {children}
        </LiveCallContext.Provider>
    )
}

export const useLiveCallContext = () => {
    const context = useContext(LiveCallContext)
    if (!context) {
        throw new Error('useLiveCallContext must be used within a LiveCallProvider')
    }
    return context
}
