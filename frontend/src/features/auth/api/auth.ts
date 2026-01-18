import { apiRequest } from "@/lib/api-client";
import {
  type LoginRequest,
  type LoginResponse,
  type SignupRequest,
  type SignupResponse,
  type ForgetPasswordRequest,
  type ForgetPasswordResponse,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type GoogleLoginRequest,
} from "@shared/types";

// =============================================================================
// API Functions
// =============================================================================

/**
 * Authenticates a user with email and password.
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> =>
  apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Registers a new user account.
 */
export const signup = async (data: SignupRequest): Promise<SignupResponse> =>
  apiRequest<SignupResponse>("/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Initiates the password reset flow by sending a reset email.
 */
export const requestForgetPassword = async (
  data: ForgetPasswordRequest,
): Promise<ForgetPasswordResponse> =>
  apiRequest<ForgetPasswordResponse>("/auth/forget-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Completes the password reset with a new password and reset token.
 */
export const resetPassword = async (
  token: string,
  data: Omit<ResetPasswordRequest, "token">,
): Promise<ResetPasswordResponse> =>
  apiRequest<ResetPasswordResponse>(`/auth/reset-password/${token}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

/**
 * Authenticates a user with Google OAuth.
 */
export const loginWithGoogle = async (token: string): Promise<LoginResponse> =>
  apiRequest<LoginResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

// =============================================================================
// Type Re-exports
// =============================================================================

export type { GoogleLoginRequest };
