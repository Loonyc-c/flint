import { Locale } from '@/data/constants'

const _translationKeys = [
  // Auth
  'err.auth.unauthorized',
  'err.auth.permission_denied',
  'err.auth.invalid_token',
  'err.auth.invalid_credentials',
  'err.auth.wrong_otp',

  // Data
  'err.data.not_found',
  'err.data.conflict',

  // System
  'err.system.internal_error',
  'err.system.service_unavailable',

  // User
  'err.user.not_found',
  'err.user.already_exists'
] as const

export type TranslationKey = (typeof _translationKeys)[number]
export type TranslationData = Record<TranslationKey, string>
export type Translations = Record<
  TranslationKey,
  { [Locale.MONGOLIAN]: string; [Locale.ENGLISH]: string }
>

export interface LocalizationService {
  translate: (key: string, locale?: Locale) => string
}
