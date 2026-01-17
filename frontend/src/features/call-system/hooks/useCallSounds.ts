'use client'

import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook to manage call-related sounds (dialing and ringtone)
 */
export const useCallSounds = () => {
    const dialingAudioRef = useRef<HTMLAudioElement | null>(null)
    const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio objects on the client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            dialingAudioRef.current = new Audio('/sounds/dialing.mp3')
            dialingAudioRef.current.loop = true

            ringtoneAudioRef.current = new Audio('/sounds/ringtone.mp3')
            ringtoneAudioRef.current.loop = true
        }

        return () => {
            dialingAudioRef.current?.pause()
            ringtoneAudioRef.current?.pause()
            dialingAudioRef.current = null
            ringtoneAudioRef.current = null
        }
    }, [])

    const playDialing = useCallback(() => {
        if (dialingAudioRef.current) {
            dialingAudioRef.current.currentTime = 0
            dialingAudioRef.current.play().catch(err => {
                console.warn('Playback of dialing sound failed:', err)
            })
        }
    }, [])

    const stopDialing = useCallback(() => {
        if (dialingAudioRef.current) {
            dialingAudioRef.current.pause()
            dialingAudioRef.current.currentTime = 0
        }
    }, [])

    const playRingtone = useCallback(() => {
        if (ringtoneAudioRef.current) {
            ringtoneAudioRef.current.currentTime = 0
            ringtoneAudioRef.current.play().catch(err => {
                console.warn('Playback of ringtone failed:', err)
            })
        }
    }, [])

    const stopRingtone = useCallback(() => {
        if (ringtoneAudioRef.current) {
            ringtoneAudioRef.current.pause()
            ringtoneAudioRef.current.currentTime = 0
        }
    }, [])

    const stopAll = useCallback(() => {
        stopDialing()
        stopRingtone()
    }, [stopDialing, stopRingtone])

    return {
        playDialing,
        stopDialing,
        playRingtone,
        stopRingtone,
        stopAll
    }
}
