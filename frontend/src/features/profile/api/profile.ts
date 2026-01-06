import { apiRequest } from '@/lib/api-client'
import { ProfileUpdateRequest, ProfileResponse } from '@shared/types'

export const updateProfile = async (
  userId: string,
  data: ProfileUpdateRequest
): Promise<ProfileResponse> => {
  return apiRequest<ProfileResponse>(`/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  return apiRequest<ProfileResponse>(`/profile/${userId}`, {
    method: 'GET'
  })
}
