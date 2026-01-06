'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
// Requirement 4: Import AuthTokenPayload from shared types instead of local definition
import { User, AuthTokenPayload } from '@shared/types'

interface UserContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const STORAGE_KEY = 'flint_access_token'

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const decodeAndSetUser = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<AuthTokenPayload>(token)

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
        return
      }

      // Requirement 9: Removed console.log({ decoded }) to prevent logging sensitive user data

      setUser({
        id: decoded.data.userId,
        firstName: decoded.data.firstName,
        lastName: decoded.data.lastName,
        email: decoded.data.email,
        name: `${decoded.data.lastName} ${decoded.data.firstName}`
      })
    } catch {
      // Requirement 14: Removed console.error to prevent logging sensitive error details
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem(STORAGE_KEY)
      if (token) {
        decodeAndSetUser(token)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [decodeAndSetUser])

  const login = (token: string) => {
    localStorage.setItem(STORAGE_KEY, token)
    decodeAndSetUser(token)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

/**
 * useAuthenticatedUser - Use this in protected routes where AuthGuard guarantees authentication
 * Returns a non-null user, throwing an error if called when user is null
 * This eliminates the need for null checks in every component
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
