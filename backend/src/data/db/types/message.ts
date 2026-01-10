import { BaseCollection } from '@shared/types'
import { WithId } from 'mongodb'

export type Message = WithId<DbMessage>

export type DbMessage = BaseCollection & {
  matchId: string // Store as string to match match._id format
  senderId: string
  text: string
  readAt?: Date
}
