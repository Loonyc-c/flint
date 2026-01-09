/**
 * Internationalization (i18n) Types
 *
 * Centralized type definitions for the i18n system.
 * These types ensure type safety across frontend and backend.
 */

/**
 * Supported locales in the application.
 * Add new locales here to enable them throughout the entire system.
 */
export const SUPPORTED_LOCALES = ['en', 'mn'] as const

/**
 * Type representing a valid locale code.
 */
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/**
 * Default locale used when no locale is specified or detected.
 */
export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Type guard to validate if a string is a supported locale.
 *
 * @example
 * ```ts
 * const userLocale = getUserLocale(); // string
 * if (isValidLocale(userLocale)) {
 *   // userLocale is now typed as Locale
 *   setLocale(userLocale);
 * }
 * ```
 */
export function isValidLocale(value: string | undefined | null): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale)
}

/**
 * Safely parse a locale string, returning the default if invalid.
 *
 * @example
 * ```ts
 * const locale = parseLocale(request.headers['accept-language']); // Locale
 * ```
 */
export function parseLocale(value: string | undefined | null): Locale {
  return isValidLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Message dictionary structure for i18n.
 * Extend this type as you add more translation namespaces.
 */
export interface Messages {
  HomePage: {
    loading: string
  }
  // Add more namespaces as needed:
  // Auth: { ... };
  // Profile: { ... };
}

/**
 * Deeply nested translation key paths.
 * Useful for type-safe translation functions.
 *
 * @example
 * ```ts
 * function t(key: TranslationKey): string { ... }
 * t('HomePage.loading'); // ✅ Valid
 * t('HomePage.invalid'); // ❌ TypeScript error
 * ```
 */
export type TranslationKey = {
  [K in keyof Messages]: `${K}.${keyof Messages[K] & string}`
}[keyof Messages]
