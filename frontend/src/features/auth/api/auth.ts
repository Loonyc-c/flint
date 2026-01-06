import { apiRequest } from '@/lib/api-client'
// Requirement 5: Import GoogleLoginRequest from shared types instead of local definition
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  GoogleLoginRequest
} from '@shared/types'

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  return apiRequest<SignupResponse>('/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const requestForgetPassword = async (
  data: ForgetPasswordRequest
): Promise<ForgetPasswordResponse> => {
  return apiRequest<ForgetPasswordResponse>('/auth/forget-password', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const resetPassword = async (
  token: string,
  data: Omit<ResetPasswordRequest, 'token'>
): Promise<ResetPasswordResponse> => {
  return apiRequest<ResetPasswordResponse>(`/auth/reset-password/${token}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

// Re-export GoogleLoginRequest for backwards compatibility
export type { GoogleLoginRequest }

export const loginWithGoogle = async (token: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
}
