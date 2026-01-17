import { defineRouting } from 'next-intl/routing'
import {
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    isValidLocale as sharedIsValidLocale,
    type Locale as SharedLocale
} from '@/shared-types/types/i18n'

// =============================================================================
// Re-exports
// =============================================================================

/**
 * Re-export shared i18n types and utilities.
 */
export const locales = SUPPORTED_LOCALES
export type Locale = SharedLocale
export const isValidLocale = sharedIsValidLocale

// =============================================================================
// Routing Configuration
// =============================================================================

/**
 * Next-intl routing configuration.
 * Defines supported locales and default locale for the application.
 */
export const routing = defineRouting({
    locales: [...SUPPORTED_LOCALES],
    defaultLocale: DEFAULT_LOCALE
})
