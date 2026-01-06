import { BaseCollection } from '@/data/base/types'
import { SubScription, UserContactInfo, UserPreferences, UserProfile } from '@/data/base/types/user'
import { WithId } from 'mongodb'

export type User = WithId<DbUser>
export type DbUser = BaseCollection & {
  auth: {
    firstName: string
    lastName: string
    email: string
    password: string
    passwordResetToken?: string
    passwordResetExpires?: Date
  }
  profile?: UserProfile
  subScription: SubScription
  preferences: UserPreferences
  contactInfo?: UserContactInfo
  profileCompletion: number
}