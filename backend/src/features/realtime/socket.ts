import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { socketAuthMiddleware, AuthenticatedSocket } from './middleware/auth.middleware'
import { registerChatHandlers } from './handlers/chat.handler'
import { registerVideoHandlers } from './handlers/video.handler'
import { registerStagedCallHandlers } from './handlers/staged-call.handler'
import { registerLiveCallHandlers } from './handlers/live-call.handler'
import { busyStateService } from './services/busy-state.service'

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
    
    // Join user's personal room for direct messages
    socket.join(`user:${authSocket.userId}`)

    // Send current busy states to the newly connected user
    socket.emit('busy-states-sync', busyStateService.getAllBusyUsers())

    // Register event handlers
    registerChatHandlers(io!, authSocket)
    registerVideoHandlers(io!, authSocket)
    registerStagedCallHandlers(io!, authSocket)
    registerLiveCallHandlers(io!, authSocket)

    // Handle disconnection
    socket.on('disconnect', (_reason) => {
      // Disconnect cleanup logic
    })

    // Handle errors
    socket.on('error', (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`❌ [Socket.io] Socket error for user ${authSocket.userId}:`, error)
      }
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
