import { getRequestConfig } from 'next-intl/server'
import { routing, isValidLocale, type Locale } from './routing'

// =============================================================================
// Message Loader
// =============================================================================

/**
 * Type-safe message loader for i18n.
 * Dynamically imports the correct JSON file based on locale.
 */
const loadMessages = async (locale: Locale): Promise<Record<string, unknown>> =>
  (await import(`../messages/${locale}.json`)).default

// =============================================================================
// Request Configuration
// =============================================================================

/**
 * Server-side request configuration for next-intl.
 * Handles locale detection and message loading.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale

  // Ensure valid locale with proper type narrowing
  const locale: Locale = isValidLocale(requestedLocale) ? requestedLocale : routing.defaultLocale

  return {
    locale,
    messages: await loadMessages(locale)
  }
})
