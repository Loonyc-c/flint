import { useCallback, useRef, useState, useEffect } from 'react'

export const useCallTimer = () => {
    const [remainingTime, setRemainingTime] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        setRemainingTime(0)
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    return { remainingTime, startTimer, stopTimer, setRemainingTime }
}
