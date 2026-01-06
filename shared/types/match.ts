import { INTERESTS, USER_GENDER } from './enums'
import { QuestionAnswer } from './profile'

export enum InteractionType {
  LIKE = 'like',
  DISLIKE = 'dislike'
}

export interface Interaction {
  _id?: string
  actorId: string
  targetId: string
  type: InteractionType
  createdAt: Date
}

export interface Match {
  _id?: string
  users: string[] // Array of user IDs
  createdAt: Date
  updatedAt: Date
}

export interface SwipeRequest {
  targetId: string
  type: InteractionType
}

export interface SwipeResponse {
  isMatch: boolean
  matchId?: string
}

export interface MatchWithUser {
  id: string
  createdAt: Date
  otherUser: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  nickName: string
  age: number
  gender: USER_GENDER
  bio: string
  interest: INTERESTS[]
  photos: string[]
  voiceIntro: string
  questions: QuestionAnswer[]
}
