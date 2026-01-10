import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'

// Track active calls: matchId -> { callerId, calleeId, status, startTime }
interface ActiveCall {
  callerId: string
  calleeId: string
  status: 'ringing' | 'active' | 'ended'
  startTime: Date
  channelName: string
}

const activeCalls = new Map<string, ActiveCall>()

/**
 * Register video call socket event handlers
 */
export const registerVideoHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  /**
   * Initiate a video call
   */
  socket.on('call-initiate', (data: { matchId: string; calleeId: string }) => {
    const { matchId, calleeId } = data

    // Check if there's already an active call in this match
    const existingCall = activeCalls.get(matchId)
    if (existingCall && existingCall.status !== 'ended') {
      socket.emit('call-error', {
        matchId,
        error: 'A call is already in progress',
      })
      return
    }

    // Create channel name for Agora
    const channelName = `match_${matchId}_${Date.now()}`

    // Store the call info
    const call: ActiveCall = {
      callerId: userId,
      calleeId,
      status: 'ringing',
      startTime: new Date(),
      channelName,
    }
    activeCalls.set(matchId, call)

    console.log(`📞 [Video] Call initiated: ${userId} -> ${calleeId} in match ${matchId}`)

    // Notify the callee
    io.to(`user:${calleeId}`).emit('call-incoming', {
      matchId,
      callerId: userId,
      callerName: socket.user.firstName,
      channelName,
      timestamp: new Date().toISOString(),
    })

    // Confirm to caller that call is ringing
    socket.emit('call-ringing', {
      matchId,
      calleeId,
      channelName,
    })

    // Auto-timeout after 30 seconds if not answered
    setTimeout(() => {
      const call = activeCalls.get(matchId)
      if (call && call.status === 'ringing') {
        activeCalls.delete(matchId)
        
        io.to(`user:${userId}`).emit('call-timeout', { matchId })
        io.to(`user:${calleeId}`).emit('call-missed', {
          matchId,
          callerId: userId,
        })
        
        console.log(`⏰ [Video] Call timeout in match ${matchId}`)
      }
    }, 30000)
  })

  /**
   * Accept incoming call
   */
  socket.on('call-accept', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeCalls.get(matchId)

    if (!call || call.calleeId !== userId) {
      socket.emit('call-error', {
        matchId,
        error: 'No incoming call found',
      })
      return
    }

    if (call.status !== 'ringing') {
      socket.emit('call-error', {
        matchId,
        error: 'Call is no longer available',
      })
      return
    }

    // Update call status
    call.status = 'active'
    call.startTime = new Date()

    console.log(`✅ [Video] Call accepted in match ${matchId}`)

    // Notify both users
    io.to(`user:${call.callerId}`).emit('call-accepted', {
      matchId,
      channelName: call.channelName,
      calleeId: userId,
    })

    socket.emit('call-connected', {
      matchId,
      channelName: call.channelName,
      callerId: call.callerId,
    })
  })

  /**
   * Decline incoming call
   */
  socket.on('call-decline', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeCalls.get(matchId)

    if (!call || call.calleeId !== userId) {
      return
    }

    console.log(`❌ [Video] Call declined in match ${matchId}`)

    // Remove the call
    activeCalls.delete(matchId)

    // Notify the caller
    io.to(`user:${call.callerId}`).emit('call-declined', {
      matchId,
      calleeId: userId,
    })
  })

  /**
   * End active call
   */
  socket.on('call-end', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeCalls.get(matchId)

    if (!call) {
      return
    }

    // Calculate call duration
    const duration = call.status === 'active'
      ? Math.floor((Date.now() - call.startTime.getTime()) / 1000)
      : 0

    console.log(`📵 [Video] Call ended in match ${matchId} (duration: ${duration}s)`)

    // Remove the call
    activeCalls.delete(matchId)

    // Notify both users
    const otherUserId = call.callerId === userId ? call.calleeId : call.callerId
    
    io.to(`user:${otherUserId}`).emit('call-ended', {
      matchId,
      endedBy: userId,
      duration,
    })

    socket.emit('call-ended', {
      matchId,
      endedBy: userId,
      duration,
    })
  })

  /**
   * Cancel outgoing call (before it's answered)
   */
  socket.on('call-cancel', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeCalls.get(matchId)

    if (!call || call.callerId !== userId || call.status !== 'ringing') {
      return
    }

    console.log(`🚫 [Video] Call cancelled in match ${matchId}`)

    // Remove the call
    activeCalls.delete(matchId)

    // Notify the callee
    io.to(`user:${call.calleeId}`).emit('call-cancelled', {
      matchId,
      callerId: userId,
    })
  })

  /**
   * Toggle audio/video during call (for UI sync)
   */
  socket.on('call-media-toggle', (data: { matchId: string; mediaType: 'audio' | 'video'; enabled: boolean }) => {
    const { matchId, mediaType, enabled } = data
    const call = activeCalls.get(matchId)

    if (!call || call.status !== 'active') {
      return
    }

    const otherUserId = call.callerId === userId ? call.calleeId : call.callerId

    // Notify the other user about media state change
    io.to(`user:${otherUserId}`).emit('call-media-changed', {
      matchId,
      userId,
      mediaType,
      enabled,
    })
  })

  /**
   * Cleanup on disconnect - end any active calls
   */
  socket.on('disconnect', () => {
    // Find and end any calls this user is part of
    for (const [matchId, call] of activeCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        const otherUserId = call.callerId === userId ? call.calleeId : call.callerId
        
        activeCalls.delete(matchId)
        
        io.to(`user:${otherUserId}`).emit('call-ended', {
          matchId,
          endedBy: userId,
          reason: 'disconnect',
        })
        
        console.log(`📵 [Video] Call ended due to disconnect in match ${matchId}`)
      }
    }
  })
}

/**
 * Get active call for a match (for API endpoints)
 */
export const getActiveCall = (matchId: string): ActiveCall | undefined => {
  return activeCalls.get(matchId)
}
