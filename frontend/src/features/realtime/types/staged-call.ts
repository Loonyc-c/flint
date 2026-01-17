import type {
    StagedCallAcceptedPayload,
    StagedCallEndedPayload,
    StagePromptPayload,
    StagePromptResult,
    ContactExchangePayload,
    ContactInfoDisplay
} from '@shared/types'

export type StagedCallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'prompt'

export interface IncomingStagedCall {
    matchId: string
    callerId: string
    callerName: string
    channelName: string
    stage: 1 | 2
    callType: 'audio' | 'video'
}

export interface IcebreakerPayload {
    matchId: string
    questions: string[]
    timestamp: string
}

export interface UseStagedCallOptions {
    onIncomingCall?: (call: IncomingStagedCall) => void
    onCallAccepted?: (data: StagedCallAcceptedPayload) => void
    onCallDeclined?: (data: { matchId: string }) => void
    onCallEnded?: (data: StagedCallEndedPayload) => void
    onStagePrompt?: (data: StagePromptPayload) => void
    onPromptResult?: (data: StagePromptResult) => void
    onContactExchange?: (data: ContactExchangePayload) => void
    onIcebreaker?: (data: IcebreakerPayload) => void
}

export interface UseStagedCallReturn {
    callStatus: StagedCallStatus
    currentCall: { matchId: string; channelName: string; stage: 1 | 2; duration: number } | null
    incomingCall: IncomingStagedCall | null
    remainingTime: number
    stagePrompt: StagePromptPayload | null
    partnerContact: ContactInfoDisplay | null
    icebreaker: IcebreakerPayload | null
    initiateCall: (matchId: string, calleeId: string, stage: 1 | 2) => void
    acceptCall: (matchId: string) => void
    declineCall: (matchId: string) => void
    endCall: (matchId: string) => void
    respondToPrompt: (matchId: string, accepted: boolean) => void
}
