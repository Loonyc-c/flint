import { BaseCollection, StagedCallStatus, StagedCallType } from '@shared/types'
import { WithId } from 'mongodb'

export type StagedCall = WithId<DbStagedCall>

// Database schema for staged call sessions
export type DbStagedCall = BaseCollection & {
  matchId: string
  stage: 1 | 2
  callType: StagedCallType
  callerId: string
  calleeId: string
  channelName: string
  status: StagedCallStatus
  startTime?: Date
  endTime?: Date
  duration: number // Target duration in milliseconds
  actualDuration?: number // Actual call duration if completed
}

// Stage prompt tracking in database
export type DbStagePrompt = BaseCollection & {
  matchId: string
  fromStage: 1 | 2
  responses: Record<string, boolean | null> // userId -> accepted/declined/pending
  expiresAt: Date
  resolvedAt?: Date
  result?: 'both_accepted' | 'declined' | 'timeout'
}
