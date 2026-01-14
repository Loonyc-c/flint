import { apiRequest } from '@/lib/api-client'
import type { MatchStage } from '@shared/types'

// =============================================================================
// Types
// =============================================================================

interface GetMatchStageResponse {
  matchId: string
  stage: MatchStage
  contactExchangedAt?: string
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get the current stage of a match
 * 
 * @param matchId - The match ID
 */
export const getMatchStage = async (matchId: string): Promise<GetMatchStageResponse> =>
  apiRequest<GetMatchStageResponse>(`/staged-call/match/${matchId}/stage`, {
    method: 'GET'
  })
