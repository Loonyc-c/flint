/**
 * Staged Calling Types
 * Types for the 3-stage calling progression system
 */

// Match progression stages
export type MatchStage = 'fresh' | 'stage1_complete' | 'stage2_complete' | 'unlocked'

// Call types for each stage
export type StagedCallType = 'audio' | 'video'

// Call session status
export type StagedCallStatus = 'ringing' | 'active' | 'ended' | 'prompt_pending'

// Active staged call session
export interface StagedCallSession {
  matchId: string
  stage: 1 | 2
  callType: StagedCallType
  startTime: Date
  duration: number // in milliseconds
  status: StagedCallStatus
  callerId: string
  calleeId: string
  channelName: string
}

// Stage prompt for transitioning between stages
export interface StagePrompt {
  matchId: string
  fromStage: 1 | 2
  responses: Record<string, boolean | null> // userId -> accepted/declined/pending
  expiresAt: Date // 10 seconds from prompt start
}

// Stage prompt response from a user
export interface StagePromptResponse {
  matchId: string
  userId: string
  accepted: boolean
}

// Stage prompt result after both users respond
export interface StagePromptResult {
  matchId: string
  bothAccepted: boolean
  nextStage: 2 | 3 | null // null if declined/timeout
}

// Contact exchange data for stage 3
export interface ContactExchangeData {
  matchId: string
  userId: string
  contactInfo: ContactInfoDisplay
  expiresAt: Date // 30 seconds display time
}

// Displayable contact info (subset of UserContactInfo)
export interface ContactInfoDisplay {
  phone?: string
  instagram?: string
  telegram?: string
  snapchat?: string
  whatsapp?: string
  wechat?: string
  facebook?: string
  twitter?: string
  linkedin?: string
  other?: string
}

// Timing constants for staged calls
export const STAGED_CALL_CONSTANTS = {
  RING_TIMEOUT: 15_000, // 15 seconds
  STAGE1_DURATION: 90_000, // 1:30 minutes
  STAGE2_DURATION: 120_000, // 2 minutes
  PROMPT_TIMEOUT: 10_000, // 10 seconds
  CONTACT_DISPLAY_DURATION: 30_000, // 30 seconds
  TIMER_SYNC_INTERVAL: 10_000, // sync every 10 seconds
} as const

// Socket event payloads
export interface StagedCallInitiatePayload {
  matchId: string
  calleeId: string
  stage: 1 | 2
}

export interface StagedCallRingingPayload {
  matchId: string
  callerId: string
  callerName: string
  channelName: string
  stage: 1 | 2
  callType: StagedCallType
}

export interface StagedCallAcceptedPayload {
  matchId: string
  channelName: string
  stage: 1 | 2
  duration: number
}

export interface StagedCallTimerPayload {
  matchId: string
  remainingTime: number // milliseconds
  stage: 1 | 2
}

export interface StagedCallEndedPayload {
  matchId: string
  stage: 1 | 2
  promptNextStage: boolean
}

export interface StagePromptPayload {
  matchId: string
  fromStage: 1 | 2
  expiresAt: string // ISO string
}

export interface ContactExchangePayload {
  matchId: string
  partnerContact: ContactInfoDisplay
  expiresAt: string // ISO string
}
