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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'UserContext.tsx:86',message:'Token expired while decoding',data:{hasStoredToken:!!storedToken,expMs:decoded.exp*1000,nowMs:Date.now()},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'UserContext.tsx:105',message:'Decoded token and set user',data:{userId:newUser.id,hasToken:true},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'UserContext.tsx:108',message:'Failed to decode stored token',data:{hasStoredToken:!!storedToken},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'UserContext.tsx:118',message:'UserProvider mount init',data:{hasStoredToken:!!storedToken,hasCookie:typeof document!=='undefined'?document.cookie.includes(`${STORAGE_KEY}=`):null,currentPath:typeof window!=='undefined'?window.location.pathname:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Keep client (localStorage/UserContext) and middleware (cookie) in sync.
    // We treat localStorage as the "logout" signal:
    // - If localStorage is missing but cookie exists (e.g. user cleared localStorage), clear the cookie too so middleware doesn't keep user "logged in".
    // - If localStorage exists but cookie is missing, restore cookie so middleware aligns with client.
    if (!storedToken && cookieToken) {
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2',location:'UserContext.tsx:150',message:'Cleared cookie because localStorage token missing',data:{hadStoredToken:false,hadCookieToken:true},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }

    if (storedToken && !cookieToken) {
      document.cookie = `${STORAGE_KEY}=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'H2',location:'UserContext.tsx:158',message:'Restored cookie because localStorage token exists',data:{hadStoredToken:true,hadCookieToken:false},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }

    if (storedToken) {
      decodeAndSetUser(storedToken)
    }
    setIsLoading(false)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'UserContext.tsx:124',message:'UserProvider init complete (isLoading false)',data:{hasStoredToken:!!storedToken},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'UserContext.tsx:138',message:'login() called',data:{hasTokenArg:!!token,tokenLength:typeof token==='string'?token.length:null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      localStorage.setItem(STORAGE_KEY, token)
      // Set cookie for middleware access
      document.cookie = `${STORAGE_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'UserContext.tsx:143',message:'login() stored token and set cookie',data:{hasLocalStorageToken:!!localStorage.getItem(STORAGE_KEY),hasCookie:typeof document!=='undefined'?document.cookie.includes(`${STORAGE_KEY}=`):null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
