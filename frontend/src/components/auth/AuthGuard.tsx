'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/i18n/routing'
import { useUser } from '@/features/auth/context/UserContext'

/**
 * AuthGuard Component
 *
 * Provides route protection for the application by:
 * 1. Checking authentication status via UserContext
 * 2. Redirecting unauthenticated users to /auth for protected routes
 * 3. Allowing access to public routes without authentication
 * 4. Preventing flickering with proper loading states
 */

// Public routes that don't require authentication
// These routes are accessible without a valid access token
const PUBLIC_ROUTES = [
  '/auth', // Main auth page (login/signup tabs)
  '/auth/forget-password', // Password recovery request
  '/auth/reset-password' // Password reset with token
]

// Check if a pathname matches any public route
const isPublicRoute = (pathname: string): boolean => {
  // Exact match for auth routes
  // Also allow any sub-paths of public routes (e.g., /auth/reset-password?token=xxx)
  return PUBLIC_ROUTES.some(
    route =>
      pathname === route || pathname.startsWith(`${route}?`) || pathname.startsWith(`${route}/`)
  )
}

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  // Derive route status
  const isPublic = isPublicRoute(pathname)

  // Determine if a redirect is needed
  const needsRedirect =
    (!isAuthenticated && !isPublic) || // Unauth user on protected route
    (isAuthenticated && isPublic) // Auth user on public route

  // isReady is derived from auth state - no separate state needed
  const isReady = !isLoading && !needsRedirect

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) {
      return
    }

    if (!isAuthenticated && !isPublic) {
      // User is not authenticated and trying to access a protected route
      // Redirect to auth page
      router.replace('/auth')
      return
    }

    if (isAuthenticated && isPublic) {
      // User is authenticated but on an auth page
      // Redirect to home/main page
      router.replace('/home')
      return
    }
  }, [isAuthenticated, isLoading, isPublic, router])

  // Show loading state while:
  // 1. Auth state is being determined (isLoading)
  // 2. We haven't completed auth checks/redirects (!isReady)
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Animated loading spinner */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-muted" />
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-brand animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  // Auth check passed, render children
  return <>{children}</>
}

export default AuthGuard
