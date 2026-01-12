/**
 * Shared Types Exports
 * Clean single entry point for all shared types
 */

export type {
  User,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthTokenPayload,
  ApiResponse,
  AuthError,
  GoogleLoginRequest
} from './auth'

export type { Interaction, Match, MatchWithUser, MatchLastMessagePreview, LikePreview, SwipeRequest, SwipeResponse, SwipeAction } from './match'
export { InteractionType } from './match'
export * from './enums'
export * from './base'
export * from './user'
export * from './questions'
export * from './chat'

// i18n types and utilities
export type { Locale, Messages, TranslationKey } from './i18n'
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, isValidLocale, parseLocale } from './i18n'

// Staged calling types
export * from './staged-call'
