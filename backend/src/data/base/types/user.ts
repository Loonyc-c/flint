import { INTERESTS, LOOKING_FOR, SUBSCRIPTION_PLANS, USER_GENDER } from '../enums/user'

export type UserProfile = {
  nickName: string
  age: number
  gender: USER_GENDER
  bio: string
  interest: INTERESTS[]
  photos: string[]
  voiceIntro: string
  questions: {
    question: string
    audioUrl: string
  }
}

export type SubScription = {
  plan: SUBSCRIPTION_PLANS
  startDate?: Date
  enDate?: Date
  isActive: boolean
}

export type UserPreferences = {
  ageRange: {
    mn: number
    en: number
  }
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
  isContactVerified: boolean
}
