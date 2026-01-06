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
