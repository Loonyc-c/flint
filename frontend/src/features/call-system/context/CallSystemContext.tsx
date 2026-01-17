'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { UnifiedCallInterface } from '../components/UnifiedCallInterface'
import type { PartnerInfo, CallType } from '../types/call-fsm'

// =============================================================================
// Types
// =============================================================================

interface StartCallParams {
    callType: CallType
    matchId: string
    channelName: string
    partnerInfo: PartnerInfo
    currentStage?: 1 | 2 | 3
    remainingTime?: number
    onHangup?: () => void
}

interface CallSystemContextValue {
    startCall: (params: StartCallParams) => void
    ringCall: (params: StartCallParams, isIncoming: boolean) => void
    startPreflight: (options: { requireVideo: boolean, onReady: () => void, onCancel: () => void }) => void
    acceptCall: () => void
    declineCall: () => void
    closeCall: () => void
    isCallActive: boolean
}

// =============================================================================
// Context
// =============================================================================

const CallSystemContext = createContext<CallSystemContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

interface CallParams {
    isOpen: boolean
    callType?: CallType
    matchId?: string
    channelName?: string
    partnerInfo?: PartnerInfo
    currentStage?: 1 | 2 | 3
    remainingTime?: number
    isIncoming?: boolean
    action?: 'accept' | 'decline' | 'start'
    onHangup?: () => void
    preflight?: {
        requireVideo: boolean
        onReady: () => void
        onCancel: () => void
    }
}

export const CallSystemProvider = ({ children }: { children: ReactNode }) => {
    const [callParams, setCallParams] = useState<CallParams | null>(null)

    const startCall = useCallback((params: StartCallParams) => {
        setCallParams({
            ...params,
            isOpen: true,
            isIncoming: false,
            action: 'start',
            currentStage: params.currentStage || 1,
            remainingTime: params.remainingTime || 0
        })
    }, [])

    const ringCall = useCallback((params: StartCallParams, isIncoming: boolean) => {
        setCallParams({
            ...params,
            isOpen: true,
            isIncoming,
            currentStage: params.currentStage || 1,
            remainingTime: params.remainingTime || 0
        })
    }, [])

    const startPreflight = useCallback((options: { requireVideo: boolean, onReady: () => void, onCancel: () => void }) => {
        setCallParams({
            isOpen: true,
            preflight: options
        })
    }, [])

    const acceptCall = useCallback(() => {
        setCallParams(prev => prev ? { ...prev, action: 'accept' } : null)
    }, [])

    const declineCall = useCallback(() => {
        setCallParams(prev => prev ? { ...prev, action: 'decline' } : null)
    }, [])

    const closeCall = useCallback(() => {
        setCallParams((prev) => (prev ? { ...prev, isOpen: false } : null))
    }, [])

    const isCallActive = !!(callParams?.isOpen)

    return (
        <CallSystemContext.Provider value={{ startCall, ringCall, startPreflight, acceptCall, declineCall, closeCall, isCallActive }}>
            {children}
            {callParams?.isOpen && (
                <UnifiedCallInterface
                    isOpen={callParams.isOpen}
                    callType={callParams.callType || 'live'}
                    matchId={callParams.matchId || ''}
                    channelName={callParams.channelName || ''}
                    partnerInfo={callParams.partnerInfo || { id: '', name: '' }}
                    currentStage={callParams.currentStage}
                    remainingTime={callParams.remainingTime}
                    preflight={callParams.preflight}
                    isIncoming={callParams.isIncoming}
                    action={callParams.action}
                    onHangup={callParams.onHangup}
                    onClose={closeCall}
                />
            )}
        </CallSystemContext.Provider>
    )
}

// =============================================================================
// Hook
// =============================================================================

export const useCallSystem = () => {
    const context = useContext(CallSystemContext)
    if (!context) {
        throw new Error('useCallSystem must be used within a CallSystemProvider')
    }
    return context
}
