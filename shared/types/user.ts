import type { INTERESTS, LOOKING_FOR, SUBSCRIPTION_PLANS, USER_GENDER } from './enums'

export type UserProfile = {
  nickName: string
  age: number
  gender: USER_GENDER
  bio: string
  interests: INTERESTS[]
  photo: string
  photos?: string[]
  voiceIntro: string
  questions: QuestionAnswer[]
}

export type Subscription = {
  plan: SUBSCRIPTION_PLANS
  startDate?: Date
  endDate?: Date
  isActive: boolean
}

export type UserPreferences = {
  ageRange: number // max age range
  lookingFor: LOOKING_FOR
}

export type UserContactInfo = {
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
  verifiedPlatforms: string[]
}

export interface QuestionAnswer {
  questionId: string
  audioUrl: string
  uploadId: string
  audioFile?: Blob | string
}

export interface ProfileUpdateRequest {
  nickName: string
  age: number
  gender: USER_GENDER
  bio: string
  interests: INTERESTS[]
  photo: string
  voiceIntro: string
  questions: QuestionAnswer[]
}
export interface ProfileResponse {
  isComplete: boolean
  profile?: ProfileUpdateRequest
}

export interface UserAuth {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordResetToken?: string
  passwordResetExpires?: Date
}

export interface ReferenceUpdateRequest {
  ageRange: number
  lookingFor: LOOKING_FOR
}
