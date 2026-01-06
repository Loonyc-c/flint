import { apiRequest } from '@/lib/api-client'
import {
  UserProfile,
  SwipeRequest,
  SwipeResponse,
  Match
} from '@shared/types'

export const getCandidates = async (userId: string, limit: number = 20): Promise<UserProfile[]> => {
  return apiRequest<UserProfile[]>(`/matches/candidates/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ limit })
  })
}

export const swipe = async (userId: string, data: SwipeRequest): Promise<SwipeResponse> => {
  return apiRequest<SwipeResponse>(`/matches/swipe/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const getMatches = async (userId: string): Promise<Match[]> => {
  return apiRequest<Match[]>(`/matches/${userId}`, {
    method: 'GET'
  })
}
