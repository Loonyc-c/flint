import { INTERESTS, USER_GENDER } from './enums'

export interface QuestionAnswer {
  questionId: string
  audioUrl: string
}

export interface ProfileCreationRequest {
  nickName: string
  age: number
  gender: USER_GENDER
  bio: string
  interests: INTERESTS[]
  photos: string[]
  voiceIntro: string
  questions: QuestionAnswer[]
}

export interface ProfileResponse {
  isComplete: boolean
  profile?: ProfileCreationRequest
}
