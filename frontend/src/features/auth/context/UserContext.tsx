'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { type User, type AuthTokenPayload, type ProfileResponse } from '@shared/types'
import { apiRequest } from '@/lib/api-client'

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'flint_access_token'

// =============================================================================
// Types
// =============================================================================

interface UserContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
  refreshProfile: () => Promise<void>
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
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Refreshes the user's profile data (e.g., photo).
   */
  const refreshProfile = useCallback(async () => {
    if (!token || !user?.id) return

    try {
      const response = await apiRequest<ProfileResponse>(`/profile/${user.id}`, {
        method: 'GET'
      })
      
      if (response.profile) {
        setUser(prev => prev ? {
          ...prev,
          profile: response.profile
        } : null)
      }
    } catch (error) {
      console.error('[UserContext] Failed to refresh profile:', error)
    }
  }, [token, user?.id])

  /**
   * Decodes a JWT token and updates user state.
   * Clears token if expired or invalid.
   */
  const decodeAndSetUser = useCallback((storedToken: string) => {
    try {
      const decoded = jwtDecode<AuthTokenPayload>(storedToken)

      // Check token expiration
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
        setToken(null)
        return
      }

      setToken(storedToken)
      const newUser = {
        id: decoded.data.userId,
        firstName: decoded.data.firstName,
        lastName: decoded.data.lastName,
        email: decoded.data.email,
        name: `${decoded.data.lastName} ${decoded.data.firstName}`
      }
      setUser(newUser)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
      setToken(null)
    }
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY)
    const cookieToken =
      typeof document !== 'undefined'
        ? document.cookie
            .split('; ')
            .find(v => v.startsWith(`${STORAGE_KEY}=`))
            ?.split('=')
            .slice(1)
            .join('=') ?? null
        : null

    // Keep client (localStorage/UserContext) and middleware (cookie) in sync.
    // We treat localStorage as the "logout" signal:
    // - If localStorage is missing but cookie exists (e.g. user cleared localStorage), clear the cookie too so middleware doesn't keep user "logged in".
    // - If localStorage exists but cookie is missing, restore cookie so middleware aligns with client.
    if (!storedToken && cookieToken) {
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }

    if (storedToken && !cookieToken) {
      document.cookie = `${STORAGE_KEY}=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    }

    if (storedToken) {
      decodeAndSetUser(storedToken)
    }
    setIsLoading(false)
  }, [decodeAndSetUser])

  // Fetch full profile once authenticated
  useEffect(() => {
    if (user && !user.profile && token) {
      refreshProfile()
    }
  }, [user, token, refreshProfile])

  /**
   * Stores the token and updates user state.
   */
  const login = useCallback(
    (token: string) => {
      localStorage.setItem(STORAGE_KEY, token)
      // Set cookie for middleware access
      document.cookie = `${STORAGE_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      decodeAndSetUser(token)
    },
    [decodeAndSetUser]
  )

  /**
   * Clears the token and user state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    // Remove cookie
    document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    setUser(null)
    setToken(null)
  }, [])

  const value: UserContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    refreshProfile
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
