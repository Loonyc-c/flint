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
      if (busyStateService.isUserBusy(userId)) {
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

      // Use provided preferences or user defaults
      const validation = liveCallPreferencesSchema.safeParse(data)
      const preferences: LiveCallPreferences = validation.success ? validation.data : {
        gender: user.profile.gender,
        lookingFor: user.preferences?.lookingFor || 'all',
        minAge: 18,
        maxAge: 100
      }

      // 2. Add to queue
      await liveCallService.addToQueue(userId, {
        gender: user.profile.gender,
        age: user.profile.age,
        preferences
      })

      busyStateService.setUserStatus(userId, 'queueing')
      
      // 3. Try matching
      const match = await liveCallService.findMatch(userId)
      if (match) {
        const { payload1, payload2 } = match
        const partnerId = payload1.partner.id

        busyStateService.setUserStatus(userId, 'in-call')
        busyStateService.setUserStatus(partnerId, 'in-call')

        // Notify both users
        io.to(`user:${userId}`).emit(LIVE_CALL_EVENTS.MATCH_FOUND, payload1)
        io.to(`user:${partnerId}`).emit(LIVE_CALL_EVENTS.MATCH_FOUND, payload2)
        
        console.log(`🔥 [LiveCall] Match found: ${userId} <-> ${partnerId}`)
      }
    } catch (error) {
      console.error('❌ [LiveCall] Join queue error:', error)
      socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.internal_server_error' })
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
    try {
      const validation = liveCallActionSchema.safeParse(data)
      if (!validation.success) {
        socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.invalid_input' })
        return
      }

      const { matchId, action } = validation.data
      const result = await liveCallService.handleAction(userId, matchId, action)

      if (result && result.isComplete) {
        const { isMatch, partnerId, newMatchId } = result
        
        // Notify both users of the final result
        const resultPayload = { matchId, isMatch, newMatchId }
        io.to(`user:${userId}`).emit(LIVE_CALL_EVENTS.CALL_RESULT, resultPayload)
        io.to(`user:${partnerId}`).emit(LIVE_CALL_EVENTS.CALL_RESULT, resultPayload)

        // Reset busy states
        busyStateService.clearUserStatus(userId)
        busyStateService.clearUserStatus(partnerId)
        
        console.log(`✨ [LiveCall] Result for ${matchId}: Match=${isMatch}`)
      }
    } catch (error) {
      console.error('❌ [LiveCall] Action error:', error)
      socket.emit(LIVE_CALL_EVENTS.ERROR, { message: 'err.internal_server_error' })
    }
  })

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    liveCallService.removeFromQueue(userId)
    // Note: If user was in a call, we might want to notify the partner.
    // This is handled by Agora usually for the audio stream, 
    // but we should also clear the ongoing call in our service.
    // For MVP, we'll keep it simple.
  })
}