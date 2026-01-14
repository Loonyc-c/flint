import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { socketAuthMiddleware, AuthenticatedSocket } from './middleware/auth.middleware'
import { registerChatHandlers } from './handlers/chat.handler'
import { registerVideoHandlers } from './handlers/video.handler'
import { registerStagedCallHandlers } from './handlers/staged-call.handler'
import { registerLiveCallHandlers } from './handlers/live-call.handler'

let io: Server | null = null

/**
 * Initialize Socket.io server with authentication and event handlers
 */
export const initializeSocketServer = (httpServer: HttpServer): Server => {
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'

  // #region agent log
  // Parse comma-separated origins (same as app.ts does for HTTP CORS)
  const allowedOrigins = CLIENT_URL.split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean)
  // Always include localhost for development
  const allOrigins = [...new Set([...allowedOrigins, 'http://localhost:3000', 'http://localhost:3001'])]
  console.log('[DEBUG-B] Socket.io CORS config:', { CLIENT_URL_raw: CLIENT_URL, parsedOrigins: allowedOrigins, finalOrigins: allOrigins })
  // #endregion

  io = new Server(httpServer, {
    cors: {
      origin: allOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Apply authentication middleware
  io.use(socketAuthMiddleware)

  // Handle new connections
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket
    // #region agent log
    console.log('[DEBUG-C] User connected:', { userId: authSocket.userId, socketId: socket.id, transport: socket.conn.transport.name, origin: socket.handshake.headers.origin })
    // #endregion
    console.log(`🔌 [Socket.io] User connected: ${authSocket.userId} (socket: ${socket.id})`)

    // Join user's personal room for direct messages
    socket.join(`user:${authSocket.userId}`)

    // Register event handlers
    registerChatHandlers(io!, authSocket)
    registerVideoHandlers(io!, authSocket)
    registerStagedCallHandlers(io!, authSocket)
    registerLiveCallHandlers(io!, authSocket)

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      // #region agent log
      console.log('[DEBUG-D] User disconnected:', { userId: authSocket.userId, socketId: socket.id, reason })
      // #endregion
      console.log(`👋 [Socket.io] User disconnected: ${authSocket.userId} (reason: ${reason})`)
    })

    // Handle errors
    socket.on('error', (error) => {
      // #region agent log
      console.log('[DEBUG-D] Socket error:', { userId: authSocket.userId, error: String(error) })
      // #endregion
      console.error(`❌ [Socket.io] Socket error for user ${authSocket.userId}:`, error)
    })
  })

  console.log('✅ [Socket.io] Server initialized')
  return io
}

/**
 * Get the Socket.io server instance
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io server not initialized')
  }
  return io
}

/**
 * Emit event to a specific user
 */
export const emitToUser = (userId: string, event: string, data: unknown) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
  }
}

/**
 * Emit event to a match room
 */
export const emitToMatch = (matchId: string, event: string, data: unknown) => {
  if (io) {
    io.to(`match:${matchId}`).emit(event, data)
  }
}
