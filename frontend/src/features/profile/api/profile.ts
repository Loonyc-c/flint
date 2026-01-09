import { apiRequest } from '@/lib/api-client'
import { ProfileUpdateRequest, ProfileResponse } from '@shared/types'

// =============================================================================
// API Functions
// =============================================================================

/**
 * Updates a user's profile.
 *
 * @param userId - The user's ID
 * @param data - Profile data to update
 */
export const updateProfile = async (
  userId: string,
  data: ProfileUpdateRequest
): Promise<ProfileResponse> =>
  apiRequest<ProfileResponse>(`/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })

/**
 * Retrieves a user's profile.
 *
 * @param userId - The user's ID
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> =>
  apiRequest<ProfileResponse>(`/profile/${userId}`, {
    method: 'GET'
  })
