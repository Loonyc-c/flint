export interface LiveMatchData {
  matchId: string
  partnerId: string
  partnerName: string
  channelName: string
  stage: number
  callType: string
}

export interface IcebreakerPayload {
  matchId: string
  questions: string[]
  timestamp: string
}
