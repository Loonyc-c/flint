import { apiRequest } from '@/lib/api-client'
// Requirement 6: Import MatchWithUser instead of Match for getMatches return type
import { User, SwipeRequest, SwipeResponse, MatchWithUser } from '@shared/types'

export const getCandidates = async (userId: string, limit: number = 20): Promise<User[]> => {
  return apiRequest<User[]>(`/matches/candidates/${userId}`, {
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

// Requirement 6: Return type corrected to MatchWithUser[] to match backend response
export const getMatches = async (userId: string): Promise<MatchWithUser[]> => {
  return apiRequest<MatchWithUser[]>(`/matches/${userId}`, {
    method: 'GET'
  })
}
