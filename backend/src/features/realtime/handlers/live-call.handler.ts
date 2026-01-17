import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { liveCallService } from '@/features/live-call/services/live-call.service'
import { busyStateService } from '../services/busy-state.service'
import { LIVE_CALL_EVENTS, LiveCallPreferences } from '@shared/types'
import { liveCallPreferencesSchema } from '@shared/validations'
import { getUserCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'

/**
 * Register live call socket event handlers
 */
export const registerLiveCallHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  /**
   * Join the live call queue
   */
  socket.on(LIVE_CALL_EVENTS.JOIN_QUEUE, async (data: unknown) => {
    try {
      // First check: Prevent joining if already busy (except if they are just queueing)
      const currentStatus = busyStateService.getUserStatus(userId)
      if (currentStatus !== 'available' && currentStatus !== 'queueing') {
        socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.live_call.already_busy' })
        return
      }

      // 1. Get user profile and preferences if not provided
      const userCollection = await getUserCollection()
      const user = await userCollection.findOne({ _id: new ObjectId(userId) })

      if (!user || !user.profile) {
        socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.profile.not_found' })
        return
      }

      // STRICT GATE: Block if profile < 80%
      if ((user.profileCompletion || 0) < 80) {
        socket.emit(LIVE_CALL_EVENTS.ERROR, {
          message: 'err.profile.incomplete_for_call',
          isReadableMessage: true
        })
        return
      }

      // Use provided preferences or user defaults
      const validation = liveCallPreferencesSchema.safeParse(data)
      const preferences: LiveCallPreferences = validation.success
        ? validation.data
        : {
          age: user.profile.age!,
          gender: user.profile.gender!,
          lookingFor: user.preferences?.lookingFor || 'all',
          minAge: 18,
          maxAge: 100,
        }

      // 2. Add to queue
      await liveCallService.addToQueue(userId, {
        gender: user.profile.gender!,
        age: user.profile.age!,
        preferences,
      })

      // Set status AFTER successfully adding to queue
      // ATOMIC UPDATE: Lock user in queueing state
      busyStateService.trySetUserStatus(userId, 'queueing')

      // 3. Try matching
      const match = await liveCallService.findMatch(userId, (partnerId) => {
        return busyStateService.getUserStatus(partnerId) === 'queueing'
      })
      if (match) {
        const { payload1, payload2 } = match
        const partnerId = payload1.partner.id

        // ATOMIC TRANSITION: queueing -> in-call
        // If this fails (e.g. user cancelled), rollback
        const myLock = busyStateService.trySetUserStatus(userId, 'in-call')
        if (!myLock.success) {
          console.log(`[LiveCall] Match cancelled - User ${userId} state changed`)
          return
        }

        const partnerLock = busyStateService.trySetUserStatus(partnerId, 'in-call')
        if (!partnerLock.success) {
          // Partner is no longer available, rollback my status
          busyStateService.trySetUserStatus(userId, 'queueing')
          // Put me back in queue effectively (I am still in queue map)
          return
        }

        // Create Agora channel for this call (must be under 64 bytes)
        // Use short timestamp + truncated user IDs
        const timestamp = Date.now().toString(36) // Base36 = shorter
        const shortUserId = userId.slice(-8) // Last 8 chars
        const shortPartnerId = partnerId.slice(-8) // Last 8 chars
        const channelName = `lv${timestamp}${shortUserId}${shortPartnerId}`

        // Generate Agora tokens for both users using your existing service
        const { agoraService } = await import('@/features/agora/services/agora.service')
        const uid1 = agoraService.generateNumericUid(userId)
        const uid2 = agoraService.generateNumericUid(partnerId)

        const tokenData1 = agoraService.generateToken({
          channelName,
          uid: uid1,
          role: 'publisher',
        })

        const tokenData2 = agoraService.generateToken({
          channelName,
          uid: uid2,
          role: 'publisher',
        })

        // Notify both users with Agora credentials
        io.to(`user:${userId}`).emit(LIVE_CALL_EVENTS.MATCH_FOUND, {
          ...payload1,
          channelName,
          agoraToken: tokenData1.token,
          agoraUid: uid1,
        })
        io.to(`user:${partnerId}`).emit(LIVE_CALL_EVENTS.MATCH_FOUND, {
          ...payload2,
          channelName,
          agoraToken: tokenData2.token,
          agoraUid: uid2,
        })

        console.log(
          `🔥 [LiveCall] Match found: ${userId} <-> ${partnerId}, channel: ${channelName}`,
        )
      }
    } catch (error) {
      console.error('❌ [LiveCall] Join queue error:', error)
      socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.internal_server_error' })
      // Clear busy state on error
      busyStateService.clearUserStatus(userId)
    }
  })

  /**
   * Leave the live call queue
   */
  socket.on(LIVE_CALL_EVENTS.LEAVE_QUEUE, () => {
    liveCallService.removeFromQueue(userId)
    busyStateService.clearUserStatus(userId)
  })

  /**
   * Queue Heartbeat - Fixes STATE-01
   * Client emits this while queueing. If server restart lost the queue,
   * we tell client they are no longer in queue.
   */
  socket.on(LIVE_CALL_EVENTS.QUEUE_HEARTBEAT, () => {
    const isInQueue = liveCallService.isUserInQueue(userId)
    socket.emit(LIVE_CALL_EVENTS.QUEUE_STATUS, { inQueue: isInQueue })
  })

  /**
   * Handle user voluntarily ending the call
   * This is critical to clear busy state without waiting for disconnect
   */
  socket.on(LIVE_CALL_EVENTS.END_CALL, () => {
    console.log(`[DEBUG-HANGUP] Received LIVE_CALL_EVENTS.END_CALL from Socket: ${socket.id}, User: ${userId}`)
    console.log(`📞 [LiveCall] User ${userId} ended call explicitly`)

    // Clear busy state immediately for self
    liveCallService.removeFromQueue(userId)
    busyStateService.clearUserStatus(userId)

    // NEW: End active call and notify partner
    const partnerId = liveCallService.endLiveCall(userId)
    if (partnerId) {
      console.log(`[DEBUG-HANGUP] Notifying Live Call partner ${partnerId} of hangup`)
      io.to(`user:${partnerId}`).emit(LIVE_CALL_EVENTS.END_CALL)
      // Also clear partner's busy state just in case
      busyStateService.clearUserStatus(partnerId)
    }
  })

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    const userId = socket.userId

    // Remove from queue if they were queueing
    liveCallService.removeFromQueue(userId)

    // CRITICAL FIX: Clear busy state on disconnect
    busyStateService.clearUserStatus(userId)

    // NEW: End active call and notify partner
    const partnerId = liveCallService.endLiveCall(userId)
    if (partnerId) {
      console.log(`[LiveCall] User ${userId} disconnected during active call with ${partnerId}`)
      io.to(`user:${partnerId}`).emit(LIVE_CALL_EVENTS.END_CALL)
      // Also clear partner's busy state
      busyStateService.clearUserStatus(partnerId)
    }

    console.log(`🔌 [LiveCall] User ${userId} disconnected, cleared busy state`)

    // Optional: Notify partner if user was in an active call
    // You may want to track active live calls similar to staged calls
    // For now, this ensures the user's busy state is always cleared
  })
}
