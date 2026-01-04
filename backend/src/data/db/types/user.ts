import { PROFILE_STEPS } from '@/data/base/enums/user'
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
  profileStep?: PROFILE_STEPS
  profile?: UserProfile
  subScription?: SubScription
  preferences?: UserPreferences
  contactInfo?: UserContactInfo
}
