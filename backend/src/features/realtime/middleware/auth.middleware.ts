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
  try {
    // Try to get token from handshake auth first, then query params
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'))
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

    // Verify the token
    const verifiedToken = authService.extractToken(cleanToken)

    if (!verifiedToken) {
      return next(new Error('Invalid or expired token'))
    }

    // Attach user data to socket for use in handlers
    const authenticatedSocket = socket as AuthenticatedSocket
    authenticatedSocket.userId = verifiedToken.data.userId
    authenticatedSocket.user = verifiedToken.data

    console.log(`✅ [Socket.io] User authenticated: ${verifiedToken.data.userId}`)
    next()
  } catch (error) {
    console.error('❌ [Socket.io] Authentication error:', error)
    next(new Error('Authentication failed'))
  }
}
