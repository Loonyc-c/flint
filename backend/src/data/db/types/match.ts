// Requirement 11: Standardized import to use @shared/types for consistency
import { BaseCollection } from '@shared/types'
import { WithId } from 'mongodb'

export type Match = WithId<DbMatch>

// Chat metadata for performance (avoiding expensive aggregation for list view)
export interface MatchLastMessage {
  text: string
  senderId: string
  createdAt: Date
}

// Requirement 1: users stored as string[] (hex strings) per user preference
export type DbMatch = BaseCollection & {
  users: string[]
  createdAt: Date
  updatedAt: Date
  // Chat-related fields
  lastMessage?: MatchLastMessage
  unreadCounts?: Record<string, number> // UserID -> Count map
  currentTurn?: string // UserID of whose turn it is
}
