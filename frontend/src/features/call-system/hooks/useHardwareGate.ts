'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { DeviceCheckResult } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface UseHardwareGateOptions {
    requireVideo?: boolean
    requireAudio?: boolean
}

interface UseHardwareGateReturn {
    checking: boolean
    result: DeviceCheckResult | null
    checkDevices: () => Promise<void>
    cleanup: () => void
}

// =============================================================================
// Hook
// =============================================================================

export const useHardwareGate = (options: UseHardwareGateOptions = {}): UseHardwareGateReturn => {
    const { requireVideo = true, requireAudio = true } = options

    const [checking, setChecking] = useState(false)
    const [result, setResult] = useState<DeviceCheckResult | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const cleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
    }, [])

    const checkDevices = useCallback(async () => {
        setChecking(true)
        setResult(null)
        cleanup()

        try {
            // MOCK MODE: Bypass hardware checks if env var is set
            if (process.env.NEXT_PUBLIC_MOCK_HARDWARE === 'true') {
                console.warn('⚠️ [useHardwareGate] Using MOCK HARDWARE mode')
                await new Promise(resolve => setTimeout(resolve, 500)) // Fake delay
                setResult({
                    ready: true,
                    hasAudio: true,
                    hasVideo: true,
                    error: undefined
                })
                setChecking(false)
                return
            }

            // 1. First check if devices even exist
            const devices = await navigator.mediaDevices.enumerateDevices()
            const hasAudioDevice = devices.some(d => d.kind === 'audioinput')
            const hasVideoDevice = devices.some(d => d.kind === 'videoinput')

            if (requireAudio && !hasAudioDevice) {
                setResult({
                    ready: false,
                    hasAudio: false,
                    hasVideo: hasVideoDevice,
                    error: 'no_mic'
                })
                return
            }

            if (requireVideo && !hasVideoDevice) {
                setResult({
                    ready: false,
                    hasAudio: hasAudioDevice,
                    hasVideo: false,
                    error: 'no_camera'
                })
                return
            }

            // 2. Request permissions
            const constraints: MediaStreamConstraints = {
                audio: requireAudio,
                video: requireVideo
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            const audioTracks = stream.getAudioTracks()
            const videoTracks = stream.getVideoTracks()

            const hasAudio = audioTracks.length > 0
            const hasVideo = videoTracks.length > 0

            const ready = (!requireAudio || hasAudio) && (!requireVideo || hasVideo)

            setResult({
                ready,
                hasAudio,
                hasVideo,
                error: ready ? undefined : 'required_devices_missing'
            })
        } catch (error) {
            console.error('[useHardwareGate] Error:', error)

            let errorType = 'unknown'
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError' || error.message.includes('denied')) {
                    errorType = 'permission_denied'
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    errorType = 'no_hardware'
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    errorType = 'already_in_use'
                } else if (error.name === 'OverconstrainedError') {
                    errorType = 'constraints_not_met'
                }
            }

            setResult({
                ready: false,
                hasAudio: false,
                hasVideo: false,
                error: errorType
            })
        } finally {
            setChecking(false)
        }
    }, [requireAudio, requireVideo, cleanup])

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup()
    }, [cleanup])

    return {
        checking,
        result,
        checkDevices,
        cleanup
    }
}
