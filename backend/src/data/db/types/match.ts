// Requirement 11: Standardized import to use @shared/types for consistency
import { BaseCollection } from '@shared/types'
import { WithId } from 'mongodb'

export type Match = WithId<DbMatch>
// Requirement 1: users stored as string[] (hex strings) per user preference
export type DbMatch = BaseCollection & {
  users: string[]
  createdAt: Date
  updatedAt: Date
}
