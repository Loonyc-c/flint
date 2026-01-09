import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
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
 * Re-export shared i18n types and utilities for frontend use.
 * This ensures the frontend stays in sync with the shared package.
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

// =============================================================================
// Navigation Exports
// =============================================================================

/**
 * Type-safe navigation utilities from next-intl.
 * Use these instead of next/navigation for locale-aware routing.
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
