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
    isJoining: boolean
    joinQueue: (preferences?: LiveCallPreferences) => void
    leaveQueue: () => void
    reset: () => void
    setStatus: (status: LiveCallStatus) => void
}

const LiveCallContext = createContext<LiveCallContextValue | null>(null)

export const LiveCallProvider = ({ children }: { children: ReactNode }) => {
    const { socket, isConnected } = useSocket()
    const { startCall, closeCall, startPreflight } = useCallSystem()

    const [status, setStatus] = useState<LiveCallStatus>('idle')
    const [matchData, setMatchData] = useState<LiveCallMatchPayload | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isJoining, setIsJoining] = useState(false)

    // NET-03: Persist queue state for reconnection
    const queueStateRef = useRef<{ inQueue: boolean; preferences?: LiveCallPreferences }>({
        inQueue: false
    })

    // Handle Socket Reconnection
    useEffect(() => {
        if (!socket) return

        const onConnect = () => {
            if (queueStateRef.current.inQueue) {
                // console.log('🔄 [LiveCall] Socket reconnected - restoring queue state...')
                socket.emit(LIVE_CALL_EVENTS.JOIN_QUEUE, queueStateRef.current.preferences)
                // We keep status as 'queueing' (it likely didn't change in UI)
            }
        }

        socket.on('connect', onConnect)
        return () => {
            socket.off('connect', onConnect)
        }
    }, [socket])

    const joinQueue = useCallback((preferences?: LiveCallPreferences) => {
        if (!socket || !isConnected) return

        // UX-01: Prevent rage-clicking / race conditions
        if (isJoining || status !== 'idle') {

            return
        }

        setIsJoining(true)

        startPreflight({
            requireVideo: true, // Live calls require video
            onReady: () => {


                // Set persistence ref
                queueStateRef.current = { inQueue: true, preferences }

                socket.emit(LIVE_CALL_EVENTS.JOIN_QUEUE, preferences)
                setStatus('queueing')
                setError(null)
                setIsJoining(false)
            },
            onCancel: () => {

                // CRITICAL: Reset state to prevent queue UI from showing
                setStatus('idle')
                setError('Hardware check failed or cancelled')
                queueStateRef.current = { inQueue: false }
                setIsJoining(false)
            }
        })
    }, [socket, isConnected, startPreflight, isJoining, status])

    const leaveQueue = useCallback(() => {
        if (!socket || !isConnected) return


        // Clear Persistence
        queueStateRef.current = { inQueue: false }

        socket.emit(LIVE_CALL_EVENTS.LEAVE_QUEUE)
        setStatus('idle')
    }, [socket, isConnected])

    const reset = useCallback(() => {


        // EXIT CLEANUP: Tell backend we ended the call
        if (status === 'in-call' || status === 'connecting') {
            socket?.emit(LIVE_CALL_EVENTS.END_CALL)
        }

        setStatus('idle')
        setMatchData(null)
        setError(null)
        closeCall()
    }, [closeCall, socket, status])

    useEffect(() => {
        if (!socket) return

        const onMatchFound = async (
            data: LiveCallMatchPayload & { agoraToken?: string; agoraUid?: number }
        ) => {
            // HW-01: Re-check hardware before accepting match
            // HW-01: Re-check hardware before accepting match
            let isHardwareReady = true

            try {
                // SKIP Check if Mock Hardware logic is enabled
                if (process.env.NEXT_PUBLIC_MOCK_HARDWARE === 'true') {
                    // console.log('⚠️ [LiveCall] Skipping match hardware check (Mock Mode)')
                } else {
                    const devices = await navigator.mediaDevices.enumerateDevices()
                    const hasAudio = devices.some(d => d.kind === 'audioinput')
                    const hasVideo = devices.some(d => d.kind === 'videoinput')

                    if (!hasAudio || !hasVideo) {
                        console.error('[LiveCall] Hardware lost at match time!')
                        isHardwareReady = false
                    }
                }
            } catch (err) {
                console.warn('[LiveCall] Hardware check warning', err)
            }

            if (!isHardwareReady) {
                socket.emit(LIVE_CALL_EVENTS.LEAVE_QUEUE)
                setStatus('idle')
                setError('Camera or microphone disconnected')
                queueStateRef.current = { inQueue: false }
                return
            }


            setMatchData(data)
            setStatus('connecting')

            // Transition to in-call after a brief delay to allow UI feedback
            setTimeout(() => {
                setStatus('in-call')
            }, 500)

            startCall({
                callType: 'live',
                matchId: data.matchId,
                channelName: data.channelName,
                partnerInfo: {
                    id: data.partner.id,
                    name: data.partner.nickName,
                    avatar: data.partner.photo
                },
                remainingTime: Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000),
                onHangup: () => {

                    // Defer reset slightly to ensure UI cleanup happens first
                    setTimeout(reset, 100)
                }
            })
        }

        const onError = (data: { message: string }) => {
            console.error('❌ [LiveCall] Error:', data.message)
            setError(data.message)
            setStatus('error')
        }

        socket.on(LIVE_CALL_EVENTS.MATCH_FOUND, onMatchFound)
        socket.on(LIVE_CALL_EVENTS.ERROR, onError)

        // Handle remote hangup
        socket.on(LIVE_CALL_EVENTS.END_CALL, () => {

            reset()
        })

        return () => {
            socket.off(LIVE_CALL_EVENTS.MATCH_FOUND, onMatchFound)
            socket.off(LIVE_CALL_EVENTS.ERROR, onError)
            socket.off(LIVE_CALL_EVENTS.END_CALL)
        }
    }, [socket, startCall, reset])

    // Heartbeat: Check if we are still in queue (Fixes STATE-01)
    useEffect(() => {
        if (!socket || status !== 'queueing') return

        const interval = setInterval(() => {
            socket.emit(LIVE_CALL_EVENTS.QUEUE_HEARTBEAT)
        }, 3000)

        const onQueueStatus = (data: { inQueue: boolean }) => {
            if (!data.inQueue) {
                console.warn('[LiveCall] Server says not in queue, resetting...')
                setStatus('idle')
                setError('Connection lost with queue')
            }
        }

        socket.on(LIVE_CALL_EVENTS.QUEUE_STATUS, onQueueStatus)

        return () => {
            clearInterval(interval)
            socket.off(LIVE_CALL_EVENTS.QUEUE_STATUS, onQueueStatus)
        }
    }, [socket, status])

    return (
        <LiveCallContext.Provider value={{ status, matchData, error, isJoining, joinQueue, leaveQueue, reset, setStatus }}>
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
