import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/config'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Next-intl middleware for locale detection and routing.
 */
const intlMiddleware = createMiddleware(routing)

// Define route categories
const AUTH_PAGES = ['/auth']
const PROTECTED_PAGES = ['/home', '/profile', '/swipe', '/chat']

const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('flint_access_token')?.value

  // Extract current locale from pathname (first segment)
  const segments = pathname.split('/')
  const currentLocale = segments[1]
  const locales = routing.locales as unknown as string[]
  const hasLocalePrefix = !!currentLocale && locales.includes(currentLocale)

  // The "pure" pathname without the locale prefix
  const purePathname = hasLocalePrefix
    ? `/${segments.slice(2).join('/')}`
    : pathname

  const isAuthPage = AUTH_PAGES.some(path => purePathname.startsWith(path))
  const isProtectedPage = PROTECTED_PAGES.some(path => purePathname.startsWith(path))

  // 1. Guest Guard: Redirect authenticated users away from /auth to /home
  if (token && isAuthPage) {
    const locale = (hasLocalePrefix && currentLocale) ? currentLocale : routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url))
  }

  // 2. Auth Guard: Redirect unauthenticated users away from private features to /auth
  if (!token && isProtectedPage) {
    const locale = (hasLocalePrefix && currentLocale) ? currentLocale : routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/auth`, request.url))
  }

  return intlMiddleware(request)
}

export default middleware

/**
 * Middleware matcher configuration.
 * Matches all pathnames except static files and API routes.
 */
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
