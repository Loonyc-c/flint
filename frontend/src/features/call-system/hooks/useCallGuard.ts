'use client'

import { useCallback } from 'react'
import { useGlobalSocket } from '@/features/realtime'
import { useHardwareGate } from './useHardwareGate'

// =============================================================================
// Types
// =============================================================================

interface CallGuardResult {
    allowed: boolean
    reason?: 'partner_busy' | 'hardware_not_ready' | 'not_connected'
}

interface UseCallGuardReturn {
    canInitiateCall: (partnerId: string) => CallGuardResult
    checkDevices: () => Promise<void>
    checking: boolean
    hardwareReady: boolean
}

// =============================================================================
// Hook
// =============================================================================

export const useCallGuard = (): UseCallGuardReturn => {
    const { socket, busyStates, isConnected } = useGlobalSocket()
    const { checkDevices, result, checking } = useHardwareGate({
        requireVideo: false,
        requireAudio: true
    })

    const canInitiateCall = useCallback((partnerId: string): CallGuardResult => {
        // Check socket connection
        if (!socket || !isConnected) {
            return { allowed: false, reason: 'not_connected' }
        }

        // Check if partner is busy
        const partnerStatus = busyStates[partnerId]
        if (partnerStatus && partnerStatus !== 'available') {
            return { allowed: false, reason: 'partner_busy' }
        }

        // Check hardware (must be called first via checkDevices)
        if (!result || !result.ready) {
            return { allowed: false, reason: 'hardware_not_ready' }
        }

        return { allowed: true }
    }, [socket, isConnected, busyStates, result])

    return {
        canInitiateCall,
        checkDevices,
        checking,
        hardwareReady: result?.ready || false
    }
}
