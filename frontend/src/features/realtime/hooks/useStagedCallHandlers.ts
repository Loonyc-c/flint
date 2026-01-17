import { useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import type { StartCallParams } from '@/features/call-system/context/CallSystemContext'
import type {
    StagedCallRingingPayload,
    StagedCallAcceptedPayload,
    StagedCallEndedPayload,
    StagePromptPayload,
    StagePromptResult,
    ContactExchangePayload,
    ContactInfoDisplay
} from '@shared/types'
import type {
    StagedCallStatus,
    UseStagedCallOptions,
    IncomingStagedCall,
    IcebreakerPayload,
    UseStagedCallReturn
} from '../types/staged-call'

interface UseStagedCallHandlersProps {
    user: { id: string } | null
    busyStates: Record<string, string>
    options: UseStagedCallOptions
    startTimer: (duration: number) => void
    cleanupCall: () => void
    setIncomingCall: Dispatch<SetStateAction<IncomingStagedCall | null>>
    setCallStatus: Dispatch<SetStateAction<StagedCallStatus>>
    setCurrentCall: Dispatch<SetStateAction<UseStagedCallReturn['currentCall']>>
    setStagePrompt: Dispatch<SetStateAction<StagePromptPayload | null>>
    setPartnerContact: Dispatch<SetStateAction<ContactInfoDisplay | null>>
    setIcebreaker: Dispatch<SetStateAction<IcebreakerPayload | null>>
    // Refs
    callStatusRef: MutableRefObject<StagedCallStatus>
    joiningRef: MutableRefObject<boolean>
    // Call System
    setCalling: (params: StartCallParams) => void
    setIncoming: (params: StartCallParams) => void
    closeCall: () => void
}

export const useStagedCallHandlers = ({
    user,
    busyStates,
    options,
    startTimer,
    cleanupCall,
    setIncomingCall,
    setCallStatus,
    setCurrentCall,
    setStagePrompt,
    setPartnerContact,
    setIcebreaker,
    callStatusRef,
    joiningRef,
    setCalling,
    setIncoming,
    closeCall
}: UseStagedCallHandlersProps) => {

    const handleRinging = useCallback((data: StagedCallRingingPayload) => {
        const isActuallyBusy = user?.id ? busyStates[user.id] === 'in-call' : false

        if (callStatusRef.current === 'active' || isActuallyBusy) {
            return 'BUSY'
        }

        setIncomingCall(data)
        setCallStatus('ringing')
        callStatusRef.current = 'ringing'
        options.onIncomingCall?.(data)

        // Trigger Global UI
        setIncoming({
            callType: 'staged',
            matchId: data.matchId,
            channelName: data.channelName,
            partnerInfo: {
                id: data.callerId,
                name: data.callerName,
                avatar: data.callerAvatar || '' // Payload now includes avatar
            },
            currentStage: 1,
            remainingTime: 0
        })

    }, [user, busyStates, callStatusRef, setIncomingCall, setCallStatus, options, setIncoming])

    const handleConnected = useCallback((data: StagedCallAcceptedPayload) => {
        if (joiningRef.current || callStatusRef.current === 'active') {
            console.warn('Duplicate connected ignored')
            return
        }
        joiningRef.current = true

        setCallStatus('active')
        callStatusRef.current = 'active'
        setCurrentCall({
            matchId: data.matchId,
            channelName: data.channelName,
            stage: data.stage,
            duration: data.duration
        })
        setIncomingCall(null)
        startTimer(data.duration)
        options.onCallAccepted?.(data)
    }, [joiningRef, callStatusRef, setCallStatus, setCurrentCall, setIncomingCall, startTimer, options])

    const handleDeclined = useCallback((data: { matchId: string }) => {
        cleanupCall()
        setCallStatus('idle')
        callStatusRef.current = 'idle'
        closeCall()
        options.onCallDeclined?.(data)
    }, [cleanupCall, setCallStatus, callStatusRef, options, closeCall])

    const handleEnded = useCallback((data: StagedCallEndedPayload) => {
        cleanupCall()
        const newStatus = data.promptNextStage ? 'prompt' : 'idle'
        setCallStatus(newStatus)
        callStatusRef.current = newStatus
        if (!data.promptNextStage) {
            closeCall()
        }
        options.onCallEnded?.(data)
    }, [cleanupCall, setCallStatus, callStatusRef, options, closeCall])

    const handleWaiting = useCallback((data: { matchId: string; channelName: string; stage: 1 | 2; calleeId: string; calleeName?: string; calleeAvatar?: string }) => {

        setCallStatus('calling')
        callStatusRef.current = 'calling'
        setCurrentCall({ ...data, duration: 0 })

        // Trigger Global UI
        setCalling({
            callType: 'staged',
            matchId: data.matchId,
            channelName: data.channelName,
            partnerInfo: {
                id: data.calleeId,
                name: data.calleeName || 'User',
                avatar: data.calleeAvatar
            },
            currentStage: data.stage,
            remainingTime: 0
        })
    }, [setCallStatus, callStatusRef, setCurrentCall, setCalling])

    const handlePrompt = useCallback((data: StagePromptPayload) => {
        setStagePrompt(data)
        setCallStatus('prompt')
        callStatusRef.current = 'prompt'
        setIcebreaker(null)
        options.onStagePrompt?.(data)
    }, [setStagePrompt, setCallStatus, callStatusRef, setIcebreaker, options])

    const handlePromptResult = useCallback((data: StagePromptResult) => {
        setStagePrompt(null)
        setCallStatus('idle')
        callStatusRef.current = 'idle'
        setIcebreaker(null)
        options.onPromptResult?.(data)
    }, [setStagePrompt, setCallStatus, callStatusRef, setIcebreaker, options])

    const handleContactExchange = useCallback((data: ContactExchangePayload) => {
        setPartnerContact(data.partnerContact)
        setIcebreaker(null)
        options.onContactExchange?.(data)
    }, [setPartnerContact, setIcebreaker, options])

    const handleIcebreaker = useCallback((data: IcebreakerPayload) => {
        setIcebreaker(data)
        options.onIcebreaker?.(data)
    }, [setIcebreaker, options])

    const handleReset = useCallback(() => {
        cleanupCall()
        setCallStatus('idle')
        callStatusRef.current = 'idle'
        closeCall()
    }, [cleanupCall, setCallStatus, callStatusRef, closeCall])

    return {
        handleRinging,
        handleConnected,
        handleDeclined,
        handleEnded,
        handleWaiting,
        handlePrompt,
        handlePromptResult,
        handleContactExchange,
        handleIcebreaker,
        handleReset
    }
}
