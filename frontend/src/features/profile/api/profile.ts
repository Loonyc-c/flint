import { apiRequest } from '@/lib/api-client'
import { ProfileCreationRequest, ProfileResponse } from '@shared/types'

export const createProfile = async (data: ProfileCreationRequest): Promise<ProfileResponse> => {
  return apiRequest<ProfileResponse>('/profile', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const updateProfile = async (data: ProfileCreationRequest): Promise<ProfileResponse> => {
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
