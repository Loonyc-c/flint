import { apiRequest } from '@/lib/api-client'
import { type Message } from '@shared/types'

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetches messages for a specific match.
 *
 * @param matchId - The match ID to fetch messages for
 * @param params - Optional pagination parameters
 */
export const getMessages = async (
  matchId: string,
  params?: { limit?: number; before?: string }
): Promise<Message[]> => {
  const query = new URLSearchParams()
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.before) query.append('before', params.before)

  const queryString = query.toString() ? `?${query.toString()}` : ''

  return apiRequest<Message[]>(`/matches/${matchId}/messages${queryString}`, {
    method: 'GET',
  })
}

/**
 * Sends a message to a specific match.
 *
 * @param matchId - The match ID to send the message to
 * @param text - The message text
 */
export const sendMessage = async (matchId: string, text: string): Promise<Message> =>
  apiRequest<Message>(`/matches/${matchId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })

/**
 * Marks all messages in a match as read.
 *
 * @param matchId - The match ID to mark as read
 */
export const markAsRead = async (matchId: string): Promise<{ success: boolean }> =>
  apiRequest<{ success: boolean }>(`/matches/${matchId}/read`, {
    method: 'POST',
  })
