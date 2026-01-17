import { useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
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
    callStatusRef: MutableRefObject<StagedCallStatus>
    joiningRef: MutableRefObject<boolean>
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
    joiningRef
}: UseStagedCallHandlersProps) => {

    const handleRinging = useCallback((data: StagedCallRingingPayload) => {
        const isActuallyBusy = user?.id ? busyStates[user.id] === 'in-call' : false

        if (callStatusRef.current === 'active' || isActuallyBusy) {
            // Note: socket emission usually happens in the event listener, 
            // but for separation we might need to return a signal or pass socket here.
            // Ideally handlers just update state. The decline emit for busy state 
            // is a side effect. We'll return 'BUSY' to let the caller handle emit?
            // Or just pass a decline callback?
            return 'BUSY'
        }

        setIncomingCall(data)
        setCallStatus('ringing')
        callStatusRef.current = 'ringing'
        options.onIncomingCall?.(data)
    }, [user, busyStates, callStatusRef, setIncomingCall, setCallStatus, options])

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
        options.onCallDeclined?.(data)
    }, [cleanupCall, setCallStatus, callStatusRef, options])

    const handleEnded = useCallback((data: StagedCallEndedPayload) => {
        cleanupCall()
        const newStatus = data.promptNextStage ? 'prompt' : 'idle'
        setCallStatus(newStatus)
        callStatusRef.current = newStatus
        options.onCallEnded?.(data)
    }, [cleanupCall, setCallStatus, callStatusRef, options])

    const handleWaiting = useCallback((data: { matchId: string; channelName: string; stage: 1 | 2 }) => {
        setCallStatus('calling')
        callStatusRef.current = 'calling'
        setCurrentCall({ ...data, duration: 0 })
    }, [setCallStatus, callStatusRef, setCurrentCall])

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
    }, [cleanupCall, setCallStatus, callStatusRef])

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
