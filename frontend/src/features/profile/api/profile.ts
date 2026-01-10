import { apiRequest } from '@/lib/api-client'
import { type ProfileUpdateRequest, type ProfileResponse, type UserContactInfo } from '@shared/types'

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

/**
 * Updates a user's contact info.
 *
 * @param userId - The user's ID
 * @param data - Contact info to update
 */
export const updateContactInfo = async (
  userId: string,
  data: UserContactInfo
): Promise<UserContactInfo> =>
  apiRequest<UserContactInfo>(`/profile/${userId}/contact`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })

/**
 * Retrieves a user's contact info.
 *
 * @param userId - The user's ID
 */
export const getContactInfo = async (
  userId: string
): Promise<{ contactInfo: UserContactInfo | null }> =>
  apiRequest<{ contactInfo: UserContactInfo | null }>(`/profile/${userId}/contact`, {
    method: 'GET'
  })
