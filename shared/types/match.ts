export enum InteractionType {
  SMASH = 'smash',
  SUPER = 'super'
}

// Represents a user who liked you but hasn't matched yet
export interface LikePreview {
  id: string // interaction ID
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string // ISO string
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

// Last message preview for match list
export interface MatchLastMessagePreview {
  text: string
  senderId: string
  createdAt: string // ISO string
}

export interface MatchWithUser {
  id: string
  createdAt: Date
  otherUser: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  // Chat-related fields for efficient list view
  lastMessage?: MatchLastMessagePreview
  unreadCount: number
  isTheirTurn: boolean
}
