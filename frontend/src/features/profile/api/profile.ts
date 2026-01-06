import { apiRequest } from '@/lib/api-client'
import { ProfileUpdateRequest, ProfileResponse } from '@shared/types'

export const updateProfile = async (data: ProfileUpdateRequest): Promise<ProfileResponse> => {
  return apiRequest<ProfileResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const getProfile = async (): Promise<ProfileResponse> => {
  return apiRequest<ProfileResponse>('/profile', {
    method: 'GET'
  })
}
