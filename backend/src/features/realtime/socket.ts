import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { socketAuthMiddleware, AuthenticatedSocket } from './middleware/auth.middleware'
import { registerChatHandlers } from './handlers/chat.handler'
import { registerVideoHandlers } from './handlers/video.handler'
import { registerStagedCallHandlers } from './handlers/staged-call.handler'
import { registerLiveCallHandlers } from './handlers/live-call.handler'
import { busyStateService } from './services/busy-state.service'

let io: Server | null = null
// STATE-03: Track active sockets for deduplication
const activeSockets = new Map<string, string>() // userId -> socketId

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
    const userId = authSocket.userId

    // STATE-03: Socket Deduplication
    const existingSocketId = activeSockets.get(userId)
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`[Socket] Duplicate connection for User ${userId}. Disconnecting old socket ${existingSocketId}.`)

      // Force disconnect the logic
      io?.to(existingSocketId).emit('force_disconnect', { reason: 'Logged in from another tab/device' })
      io?.sockets.sockets.get(existingSocketId)?.disconnect(true)
    }
    activeSockets.set(userId, socket.id)

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`)

    // Send current busy states to the newly connected user
    socket.emit('busy-states-sync', busyStateService.getAllBusyUsers())

    // Register event handlers
    registerChatHandlers(io!, authSocket)
    registerVideoHandlers(io!, authSocket)
    registerStagedCallHandlers(io!, authSocket)
    registerLiveCallHandlers(io!, authSocket)

    // Handle disconnection
    socket.on('disconnect', (_reason) => {
      // Cleanup deduplication map
      if (activeSockets.get(userId) === socket.id) {
        activeSockets.delete(userId)
      }
    })

    // Handle errors
    socket.on('error', (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`❌ [Socket.io] Socket error for user ${userId}:`, error)
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
