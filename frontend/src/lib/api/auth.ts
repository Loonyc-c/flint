import { apiRequest } from '../api-client'
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '@/src/types/auth'

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

export interface PasswordForgetRequest {
  email: string
}

export interface PasswordForgetResponse {
  message: string
}

export const requestForgetPassword = async (
  data: PasswordForgetRequest
): Promise<PasswordForgetResponse> => {
  return apiRequest<PasswordForgetResponse>('/auth/forget-password', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export interface ResetPasswordRequest {
  token: string
  password: string
  passwordConfirm: string
}

export interface ResetPasswordResponse {
  message: string
}

export const resetPassword = async (
  token: string,
  password: string,
  passwordConfirm: string
): Promise<ResetPasswordResponse> => {
  return apiRequest<ResetPasswordResponse>(`/reset-password/${token}`, {
    method: 'PATCH',
    body: JSON.stringify({ password, passwordConfirm })
  })
}

export interface GoogleLoginRequest {
  token: string
}

export const loginWithGoogle = async (token: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
}
