import {
  Subscription,
  UserContactInfo,
  UserPreferences,
  UserProfile,
  BaseCollection,
  UserAuth,
} from '@shared/types'
import { WithId } from 'mongodb'

export type User = WithId<DbUser>
export type DbUser = BaseCollection & {
  auth: UserAuth
  profile?: UserProfile
  subscription: Subscription
  preferences: UserPreferences
  contactInfo?: UserContactInfo
  profileCompletion: number
}
