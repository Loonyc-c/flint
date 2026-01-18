import type { INTERESTS, LOOKING_FOR, SUBSCRIPTION_PLANS, USER_GENDER } from './enums'

export type UserProfile = {
  firstName?: string
  lastName?: string
  nickName?: string
  age?: number
  gender?: USER_GENDER
  bio?: string
  interests?: INTERESTS[]
  photo?: string
  voiceIntro?: string
  questions?: QuestionAnswer[]
  contact?: UserContactInfo
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
  instagram: string
  isVerified: boolean
}

export interface QuestionAnswer {
  questionId: string
  audioUrl: string
  uploadId: string
}

// Extended type for form state that includes local audio file (Blob)
// Used by frontend for real-time completeness calculation before upload
export interface QuestionAnswerWithFile extends QuestionAnswer {
  audioFile?: Blob | string
}

export interface ProfileUpdateRequest {
  firstName?: string
  lastName?: string
  nickName?: string
  age?: number
  gender?: USER_GENDER
  bio?: string
  interests?: INTERESTS[]
  photo?: string
  voiceIntro?: string
  questions?: QuestionAnswer[]
  contact?: UserContactInfo
}
export interface ProfileResponse {
  isComplete: boolean
  profileCompletion?: number
  profile?: ProfileUpdateRequest
}

export interface UserAuth {
  email: string
  password: string
  passwordResetToken?: string
  passwordResetExpires?: Date
}

export interface ReferenceUpdateRequest {
  ageRange: number
  lookingFor: LOOKING_FOR
}
