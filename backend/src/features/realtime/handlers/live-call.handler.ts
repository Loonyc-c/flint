import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { liveCallService } from '@/features/live-call/services/live-call.service'
import { busyStateService } from '../services/busy-state.service'
import { LIVE_CALL_EVENTS, LiveCallPreferences } from '@shared/types'
import { liveCallPreferencesSchema, liveCallActionSchema } from '@shared/validations'
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
      // First check: Prevent joining if already busy
      if (busyStateService.isUserBusy(userId)) {
        socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.live_call.already_busy' })
        return
      }

      // Safety check: Clear any stale busy states before proceeding
      // This handles edge cases where busy state wasn't properly cleared
      const currentStatus = busyStateService.getUserStatus(userId)
      if (currentStatus !== 'available') {
        console.warn(
          `⚠️ [LiveCall] User ${userId} attempting to join queue while ${currentStatus} - forcing clear`,
        )
        busyStateService.clearUserStatus(userId) // Force clear stale state
      }

      // 1. Get user profile and preferences if not provided
      const userCollection = await getUserCollection()
      const user = await userCollection.findOne({ _id: new ObjectId(userId) })

      if (!user || !user.profile) {
        socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.profile.not_found' })
        return
      }

      // Use provided preferences or user defaults
      const validation = liveCallPreferencesSchema.safeParse(data)
      const preferences: LiveCallPreferences = validation.success
        ? validation.data
        : {
            age: user.profile.age,
            gender: user.profile.gender,
            lookingFor: user.preferences?.lookingFor || 'all',
            minAge: 18,
            maxAge: 100,
          }

      // 2. Add to queue
      await liveCallService.addToQueue(userId, {
        gender: user.profile.gender,
        age: user.profile.age,
        preferences,
      })

      // Set status AFTER successfully adding to queue
      busyStateService.setUserStatus(userId, 'queueing')

      // 3. Try matching
      const match = await liveCallService.findMatch(userId)
      if (match) {
        const { payload1, payload2 } = match
        const partnerId = payload1.partner.id

        busyStateService.setUserStatus(userId, 'in-call')
        busyStateService.setUserStatus(partnerId, 'in-call')

        // Create Agora channel for this call
        const channelName = `live_${Date.now()}_${userId}_${partnerId}`

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
   * Handle Like/Pass action during or after call
   */
  socket.on(LIVE_CALL_EVENTS.CALL_ACTION, async (data: unknown) => {
    let result: Awaited<ReturnType<typeof liveCallService.handleAction>> | undefined
    try {
      const validation = liveCallActionSchema.safeParse(data)
      if (!validation.success) {
        socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.invalid_input' })
        return
      }

      const { matchId, action } = validation.data
      result = await liveCallService.handleAction(userId, matchId, action)

      if (result && result.isComplete) {
        const { isMatch, partnerId, newMatchId } = result

        // Notify both users of the final result
        const resultPayload = { matchId, isMatch, newMatchId }
        io.to(`user:${userId}`).emit(LIVE_CALL_EVENTS.CALL_RESULT, resultPayload)
        io.to(`user:${partnerId}`).emit(LIVE_CALL_EVENTS.CALL_RESULT, resultPayload)

        console.log(`✨ [LiveCall] Result for ${matchId}: Match=${isMatch}`)
      }
    } catch (error) {
      console.error('❌ [LiveCall] Action error:', error)
      socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.internal_server_error' })
    } finally {
      // ALWAYS clear busy states, even if there's an error
      busyStateService.clearUserStatus(userId)
      if (result?.partnerId) {
        busyStateService.clearUserStatus(result.partnerId)
      }
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
    // This handles cases where user disconnects during:
    // - Queueing
    // - Active call
    // - Any other busy state
    busyStateService.clearUserStatus(userId)

    console.log(`🔌 [LiveCall] User ${userId} disconnected, cleared busy state`)

    // Optional: Notify partner if user was in an active call
    // You may want to track active live calls similar to staged calls
    // For now, this ensures the user's busy state is always cleared
  })
}
