'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from '@/i18n/routing'
import { useUser } from '@/features/auth/context/UserContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// =============================================================================
// Constants
// =============================================================================

/**
 * Public routes that don't require authentication.
 * These routes are accessible without a valid access token.
 */
const PUBLIC_ROUTES = ['/auth', '/auth/forget-password', '/auth/reset-password'] as const

// =============================================================================
// Helpers
// =============================================================================

/**
 * Checks if a pathname matches any public route.
 * Supports exact matches and sub-paths (e.g., /auth/reset-password?token=xxx).
 */
const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.some(
    route =>
      pathname === route || pathname.startsWith(`${route}?`) || pathname.startsWith(`${route}/`)
  )

// =============================================================================
// Types
// =============================================================================

interface AuthGuardProps {
  children: ReactNode
}

// =============================================================================
// Component
// =============================================================================

/**
 * AuthGuard provides route protection by:
 * 1. Checking authentication status via UserContext
 * 2. Redirecting unauthenticated users to /auth for protected routes
 * 3. Redirecting authenticated users to /home from auth pages
 * 4. Preventing flickering with proper loading states
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  // Derive route and redirect status
  const isPublic = isPublicRoute(pathname)
  const needsRedirect = (!isAuthenticated && !isPublic) || (isAuthenticated && isPublic)
  const isReady = !isLoading && !needsRedirect

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated && !isPublic) {
      router.replace('/auth')
      return
    }

    if (isAuthenticated && isPublic) {
      router.replace('/home')
    }
  }, [isAuthenticated, isLoading, isPublic, router])

  if (isLoading || !isReady) {
    return <LoadingSpinner />
  }

  return <>{children}</>
}

export default AuthGuard
