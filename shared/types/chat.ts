import type { MatchStage } from './staged-call'

export interface Message {
  id: string
  matchId: string
  senderId: string
  text: string
  createdAt: string // ISO string for frontend simplicity usually, or Date
  readAt?: string
}

export interface ChatConversation {
  id: string // matchId
  matchId: string
  otherUser: {
    id: string
    name: string
    avatar?: string
  }
  lastMessage?: Message
  unreadCount: number
  isTheirTurn: boolean
  stage: MatchStage // Stage of the match for calling permissions
}
