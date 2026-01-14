import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * Next-intl middleware for locale detection and routing.
 */
export default createMiddleware(routing)

/**
 * Middleware matcher configuration.
 * Matches all pathnames except static files and API routes.
 */
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
