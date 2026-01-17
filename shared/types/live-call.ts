import type { USER_GENDER, LOOKING_FOR } from './enums'

export interface LiveCallPreferences {
  age: number
  gender: USER_GENDER
  lookingFor: LOOKING_FOR
  minAge: number
  maxAge: number
}

export interface LiveCallQueueUser {
  userId: string
  gender: USER_GENDER
  age: number
  preferences: LiveCallPreferences
  joinedAt: Date
}

export interface LiveCallMatchPayload {
  matchId: string
  channelName: string
  agoraToken: string
  partner: {
    id: string
    nickName: string
    age: number
    photo: string
  }
  partnerName: string // Redundant but helpful for legacy compatibility
  expiresAt: string // ISO string for the 90-second timer
}

export interface LiveCallActionPayload {
  matchId: string
  action: 'like' | 'pass'
}

export interface LiveCallResultPayload {
  matchId: string
  isMatch: boolean // true if both liked
  newMatchId?: string // If a permanent match was created
}

export const LIVE_CALL_EVENTS = {
  JOIN_QUEUE: 'live-call-join',
  LEAVE_QUEUE: 'live-call-leave',
  MATCH_FOUND: 'live-call-match-found',
  CALL_ACTION: 'live-call-action',
  CALL_RESULT: 'live-call-result',
  ERROR: 'live-call-error',
  QUEUE_HEARTBEAT: 'live-call:queue-heartbeat',
  QUEUE_STATUS: 'live-call:queue-status',
  END_CALL: 'live-call-end'
} as const
