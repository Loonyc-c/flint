import { apiRequest } from '@/lib/api-client'
import {
  type User,
  type SwipeRequest,
  type SwipeResponse,
  type MatchWithUser,
  type LikePreview
} from '@shared/types'

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
 * Records a swipe action (smash/super) on a candidate.
 * Note: Pass actions are not recorded - they are handled locally.
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
 * @param params - Optional pagination parameters
 */
export const getMatches = async (
  userId: string,
  params?: { limit?: number; offset?: number }
): Promise<MatchWithUser[]> => {
  const query = new URLSearchParams()
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.offset) query.append('offset', params.offset.toString())

  const queryString = query.toString() ? `?${query.toString()}` : ''

  return apiRequest<MatchWithUser[]>(`/matches/${userId}${queryString}`, {
    method: 'GET'
  })
}

/**
 * Retrieves users who have liked the current user but haven't matched yet.
 *
 * @param userId - The user's ID
 */
export const getLikes = async (userId: string): Promise<LikePreview[]> =>
  apiRequest<LikePreview[]>(`/matches/${userId}/likes`, {
    method: 'GET'
  })
