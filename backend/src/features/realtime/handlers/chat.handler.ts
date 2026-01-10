import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { chatService } from '@/features/chat/services/chat.service'

// Track which matches each socket is in
const socketMatchRooms = new Map<string, Set<string>>()

/**
 * Register chat-related socket event handlers
 */
export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  // Initialize room tracking for this socket
  socketMatchRooms.set(socket.id, new Set())

  /**
   * Join a match room to receive real-time updates
   */
  socket.on('join-match', async (matchId: string) => {
    try {
      // Join the room
      socket.join(`match:${matchId}`)
      socketMatchRooms.get(socket.id)?.add(matchId)

      console.log(`📥 [Chat] User ${userId} joined match room: ${matchId}`)

      // Notify others in the room that user is online
      socket.to(`match:${matchId}`).emit('user-online', {
        matchId,
        userId,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`❌ [Chat] Error joining match ${matchId}:`, error)
      socket.emit('error', { message: 'Failed to join match room' })
    }
  })

  /**
   * Leave a match room
   */
  socket.on('leave-match', (matchId: string) => {
    socket.leave(`match:${matchId}`)
    socketMatchRooms.get(socket.id)?.delete(matchId)

    console.log(`📤 [Chat] User ${userId} left match room: ${matchId}`)

    // Notify others in the room
    socket.to(`match:${matchId}`).emit('user-offline', {
      matchId,
      userId,
      timestamp: new Date().toISOString(),
    })
  })

  /**
   * Send a message in a match
   */
  socket.on('send-message', async (data: { matchId: string; text: string }) => {
    try {
      const { matchId, text } = data

      if (!matchId || !text?.trim()) {
        socket.emit('error', { message: 'Match ID and message text are required' })
        return
      }

      // Save message using chat service
      const message = await chatService.sendMessage(matchId, userId, text.trim())

      // Broadcast to all users in the match room (including sender for confirmation)
      io.to(`match:${matchId}`).emit('new-message', {
        ...message,
        matchId,
      })

      console.log(`💬 [Chat] Message sent in match ${matchId} by ${userId}`)
    } catch (error) {
      console.error(`❌ [Chat] Error sending message:`, error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  /**
   * Mark messages as read
   */
  socket.on('mark-read', async (matchId: string) => {
    try {
      await chatService.markAsRead(matchId, userId)

      // Notify the other user that messages were read
      socket.to(`match:${matchId}`).emit('messages-read', {
        matchId,
        readBy: userId,
        timestamp: new Date().toISOString(),
      })

      console.log(`✓ [Chat] Messages marked as read in match ${matchId} by ${userId}`)
    } catch (error) {
      console.error(`❌ [Chat] Error marking messages as read:`, error)
    }
  })

  /**
   * Typing indicator - start typing
   */
  socket.on('typing', (matchId: string) => {
    socket.to(`match:${matchId}`).emit('user-typing', {
      matchId,
      userId,
    })
  })

  /**
   * Typing indicator - stop typing
   */
  socket.on('stop-typing', (matchId: string) => {
    socket.to(`match:${matchId}`).emit('user-stop-typing', {
      matchId,
      userId,
    })
  })

  /**
   * Get online status of match partner
   */
  socket.on('check-online', (data: { matchId: string; otherUserId: string }) => {
    const { matchId, otherUserId } = data
    const room = io.sockets.adapter.rooms.get(`match:${matchId}`)
    
    // Check if the other user is in the room
    let isOnline = false
    if (room) {
      for (const socketId of room) {
        const memberSocket = io.sockets.sockets.get(socketId) as AuthenticatedSocket | undefined
        if (memberSocket?.userId === otherUserId) {
          isOnline = true
          break
        }
      }
    }

    socket.emit('online-status', {
      matchId,
      userId: otherUserId,
      isOnline,
    })
  })

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    // Notify all match rooms that this user went offline
    const rooms = socketMatchRooms.get(socket.id)
    if (rooms) {
      for (const matchId of rooms) {
        socket.to(`match:${matchId}`).emit('user-offline', {
          matchId,
          userId,
          timestamp: new Date().toISOString(),
        })
      }
      socketMatchRooms.delete(socket.id)
    }
  })
}
