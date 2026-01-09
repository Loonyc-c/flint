import { apiRequest } from '@/lib/api-client'
import { type User, type SwipeRequest, type SwipeResponse, type MatchWithUser } from '@shared/types'

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetches candidate profiles for the swipe feature.
 *
 * @param userId - The current user's ID
 * @param limit - Maximum number of candidates to return (default: 20)
 */
export const getCandidates = async (userId: string, limit: number = 20): Promise<User[]> =>
  apiRequest<User[]>(`/matches/candidates/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ limit })
  })

/**
 * Records a swipe action (like/dislike) on a candidate.
 *
 * @param userId - The current user's ID
 * @param data - Swipe request containing targetId and interaction type
 */
export const swipe = async (userId: string, data: SwipeRequest): Promise<SwipeResponse> =>
  apiRequest<SwipeResponse>(`/matches/swipe/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })

/**
 * Retrieves all matches for a user.
 *
 * @param userId - The user's ID
 */
export const getMatches = async (userId: string): Promise<MatchWithUser[]> =>
  apiRequest<MatchWithUser[]>(`/matches/${userId}`, {
    method: 'GET'
  })
