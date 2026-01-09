'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { User, AuthTokenPayload } from '@shared/types'

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'flint_access_token'

// =============================================================================
// Types
// =============================================================================

interface UserContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

interface UserProviderProps {
  children: ReactNode
}

// =============================================================================
// Context
// =============================================================================

const UserContext = createContext<UserContextType | undefined>(undefined)

// =============================================================================
// Provider Component
// =============================================================================

/**
 * UserProvider manages authentication state throughout the application.
 * It handles JWT token storage, decoding, and expiration validation.
 */
export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Decodes a JWT token and updates user state.
   * Clears token if expired or invalid.
   */
  const decodeAndSetUser = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<AuthTokenPayload>(token)

      // Check token expiration
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
        return
      }

      setUser({
        id: decoded.data.userId,
        firstName: decoded.data.firstName,
        lastName: decoded.data.lastName,
        email: decoded.data.email,
        name: `${decoded.data.lastName} ${decoded.data.firstName}`
      })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      decodeAndSetUser(token)
    }
    setIsLoading(false)
  }, [decodeAndSetUser])

  /**
   * Stores the token and updates user state.
   */
  const login = useCallback(
    (token: string) => {
      localStorage.setItem(STORAGE_KEY, token)
      decodeAndSetUser(token)
    },
    [decodeAndSetUser]
  )

  /**
   * Clears the token and user state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value: UserContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to access the user context.
 * Must be used within a UserProvider.
 *
 * @throws Error if used outside of UserProvider
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

/**
 * Hook for protected routes where AuthGuard guarantees authentication.
 * Returns a non-null user, eliminating the need for null checks.
 *
 * @throws Error if called when user is null (should never happen in protected routes)
 */
export const useAuthenticatedUser = () => {
  const { user, ...rest } = useUser()

  if (!user) {
    throw new Error(
      'useAuthenticatedUser must be used in a protected route where user is guaranteed to exist'
    )
  }

  return { user, ...rest }
}
