import { Socket } from 'socket.io'
import { authService, AuthToken } from '@/features/auth/services/auth.service'

// Extend Socket type to include authenticated user data
export interface AuthenticatedSocket extends Socket {
  userId: string
  user: AuthToken['data']
}

/**
 * Socket.io authentication middleware
 * Validates JWT token from handshake auth or query params
 */
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  // #region agent log
  console.log('[DEBUG-C] Socket auth middleware - incoming connection:', { 
    hasAuthToken: !!socket.handshake.auth?.token, 
    hasQueryToken: !!socket.handshake.query?.token,
    origin: socket.handshake.headers.origin,
    socketId: socket.id
  })
  // #endregion

  try {
    // Try to get token from handshake auth first, then query params
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token

    if (!token || typeof token !== 'string') {
      // #region agent log
      console.log('[DEBUG-C] Socket auth FAILED - no token provided')
      // #endregion
      return next(new Error('Authentication required'))
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

    // Verify the token
    const verifiedToken = authService.extractToken(cleanToken)

    if (!verifiedToken) {
      // #region agent log
      console.log('[DEBUG-C] Socket auth FAILED - invalid/expired token')
      // #endregion
      return next(new Error('Invalid or expired token'))
    }

    // Attach user data to socket for use in handlers
    const authenticatedSocket = socket as AuthenticatedSocket
    authenticatedSocket.userId = verifiedToken.data.userId
    authenticatedSocket.user = verifiedToken.data

    // #region agent log
    console.log('[DEBUG-C] Socket auth SUCCESS:', { userId: verifiedToken.data.userId })
    // #endregion
    console.log(`✅ [Socket.io] User authenticated: ${verifiedToken.data.userId}`)
    next()
  } catch (error) {
    // #region agent log
    console.log('[DEBUG-C] Socket auth EXCEPTION:', { error: String(error) })
    // #endregion
    console.error('❌ [Socket.io] Authentication error:', error)
    next(new Error('Authentication failed'))
  }
}
