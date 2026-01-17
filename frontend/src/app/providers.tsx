'use client'

import { type ReactNode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import { ThemeProvider, useTheme } from 'next-themes'
import 'react-toastify/dist/ReactToastify.css'
import { UserProvider } from '@/features/auth/context/UserContext'
import { GlobalSocketProvider, GlobalNotificationListener } from '@/features/realtime'
import { CallSystemProvider } from '@/features/call-system'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { HeaderWrapper } from '@/components/HeaderWrapper'


// =============================================================================
// Types
// =============================================================================

interface ProvidersProps {
  children: ReactNode
}

interface AuthProvidersProps {
  children: ReactNode
}

// =============================================================================
// Internal Components
// =============================================================================

/**
 * Theme-aware toast container that responds to dark/light mode.
 * Must be rendered inside ThemeProvider to access theme context.
 */
const ThemedToastContainer = () => {
  const { resolvedTheme } = useTheme()

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}

/**
 * Auth provider wrapper with Google OAuth.
 * Validates environment variables at runtime.
 */
const AuthProviders = ({ children }: AuthProvidersProps) => {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables')
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <UserProvider>
        <GlobalSocketProvider>
          <GlobalNotificationListener />
          <CallSystemProvider>
            <AuthGuard>
              <HeaderWrapper />
              {children}
            </AuthGuard>
          </CallSystemProvider>
          <ThemedToastContainer />
        </GlobalSocketProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  )
}

// =============================================================================
// Exports
// =============================================================================

/**
 * Root providers component that wraps the entire application.
 *
 * Provider order (outermost to innermost):
 * 1. ThemeProvider - Dark/light mode support
 * 2. GoogleOAuthProvider - Google authentication
 * 3. UserProvider - User state management
 * 4. AuthGuard - Route protection
 */
export const Providers = ({ children }: ProvidersProps) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
    <AuthProviders>{children}</AuthProviders>
  </ThemeProvider>
)
