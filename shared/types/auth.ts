/**
 * Shared Auth Types
 * Single source of truth for all auth-related types across frontend and backend
 */

import type { UserProfile } from './user'

/**
 * User data structure
 */
export interface User {
  id: string
  email: string
  name?: string
  profile?: UserProfile
  profileCompletion?: number
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Login Request
 * Used by both frontend (form submission) and backend (API endpoint)
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Login Response
 * Returned by backend after successful login
 */
export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
  }
}

/**
 * Signup Request
 * Used by frontend (form submission) and backend (API endpoint)
 */
export interface SignupRequest {
  email: string
  password: string
}

/**
 * Signup Response
 * Returned by backend after successful signup
 */
export interface SignupResponse {
  id: string
  email: string
  message: string
}

/**
 * Forget Password Request
 * Used by frontend to initiate password reset
 */
export interface ForgetPasswordRequest {
  email: string
}

/**
 * Forget Password Response
 * Returned by backend confirming email sent
 */
export interface ForgetPasswordResponse {
  message: string
  email: string
}

/**
 * Reset Password Request
 * Used by frontend to submit new password with token
 */
export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

/**
 * Reset Password Response
 * Returned by backend confirming password reset
 */
export interface ResetPasswordResponse {
  message: string
  email: string
}

/**
 * Auth Token Payload
 * Decoded JWT token structure - used for token verification and user context
 * Requirement 4: Standardized AuthTokenPayload type for frontend and backend
 */
export interface AuthTokenPayload {
  sub: string
  iss: string
  aud: string | string[]
  iat: number
  exp: number
  data: {
    userId: string
    email: string
  }
}

/**
 * Google Login Request
 * Requirement 5: Moved from frontend to shared types
 */
export interface GoogleLoginRequest {
  token: string
}

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * Auth Error Response
 */
export interface AuthError {
  code:
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  message: string
}
