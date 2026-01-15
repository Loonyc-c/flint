import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { liveCallQueueService } from '../services/live-call-queue.service'
import { getUserCollection, getMatchCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'
import { USER_GENDER, UserPreferences } from '@shared/types'
import { DbMatch } from '@/data/db/types/match'
import { randomUUID } from 'crypto'
import { triggerContactExchange } from './staged-call.handler'
import { busyStateService } from '../services/busy-state.service'

import { circuitBreaker } from '@/utils/circuit-breaker'

const MAX_QUEUE_SIZE = 1000
const promotionLocks = new Set<string>()

/**
 * Register live call socket event handlers
 */
export const registerLiveCallHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  /**
   * Join the live call queue
   */
  socket.on('live-call-join', async () => {
    try {
      if (circuitBreaker.isOpen()) {
        socket.emit('live-call-error', { message: 'System is under high load. Please try again later.' })
        return
      }

      if (busyStateService.isUserBusy(userId)) {
        socket.emit('live-call-error', { message: 'You are already in a call or queue' })
        return
      }

      const userCollection = await getUserCollection()
      const user = await userCollection.findOne({ _id: new ObjectId(userId) })

      if (!user) {
        socket.emit('live-call-error', { message: 'User not found' })
        return
      }

      // Profile Readiness Gate (80%)
      const completeness = user.profileCompletion || 0
      if (completeness < 80) {
        socket.emit('live-call-error', { 
          message: 'Profile incomplete', 
          code: 'PROFILE_INCOMPLETE',
          completeness 
        })
        return
      }

      if (!user.profile || !user.preferences) {
        socket.emit('live-call-error', { message: 'Profile incomplete' })
        return
      }

      if (liveCallQueueService.getQueueSize() >= MAX_QUEUE_SIZE) {
        socket.emit('live-call-error', { message: 'Queue is full, please try again later' })
        return
      }

      const match = liveCallQueueService.joinQueue({
        userId,
        gender: user.profile.gender as USER_GENDER,
        age: user.profile.age,
        preferences: user.preferences as UserPreferences,
        joinedAt: new Date(),
      })

      if (match) {
        // Match found!
        busyStateService.setUserStatus(userId, 'connecting')
        busyStateService.setUserStatus(match.userId, 'connecting')
        
        const ephemeralMatchId = `live_${randomUUID()}`
        const channelName = `live_call_${ephemeralMatchId}`

        // Notify both users
        const matchData = {
          matchId: ephemeralMatchId,
          partnerId: match.userId,
          partnerName: user.auth.firstName, // This is current user's name for the partner
          channelName,
          stage: 1,
          callType: 'audio',
        }

        // Notify partner
        io.to(`user:${match.userId}`).emit('live-match-found', {
          ...matchData,
          partnerId: userId,
          partnerName: user.auth.firstName,
        })

        // Notify current user
        const partnerUser = await userCollection.findOne({ _id: new ObjectId(match.userId) })
        socket.emit('live-match-found', {
          ...matchData,
          partnerId: match.userId,
          partnerName: partnerUser?.auth.firstName || 'Partner',
        })

        console.log(`🔥 [LiveCall] Match found: ${userId} <-> ${match.userId}`)
      } else {
        busyStateService.setUserStatus(userId, 'queueing')
        socket.emit('live-call-queued')
        console.log(`⏳ [LiveCall] User joined queue: ${userId}`)
      }
    } catch (error) {
      console.error('Error joining live call queue:', error)
      socket.emit('live-call-error', { message: 'Internal server error' })
    }
  })

  /**
   * Leave the live call queue
   */
  socket.on('live-call-leave', () => {
    try {
      liveCallQueueService.leaveQueue(userId)
      busyStateService.clearUserStatus(userId)
      socket.emit('live-call-left')
      console.log(`🚶 [LiveCall] User left queue: ${userId}`)
    } catch (error) {
      console.error('Error leaving live call queue:', error)
    }
  })

  /**
   * Handle Stage 3 promotion (Create formal match)
   * This is called when both users accept moving to Stage 3
   */
  socket.on('live-call-promote-match', async (data: { partnerId: string }) => {
    const { partnerId } = data
    const sortedUsers = [userId, partnerId].sort()
    const lockKey = sortedUsers.join(':')

    if (promotionLocks.has(lockKey)) return

    try {
      promotionLocks.add(lockKey)
      const matchCollection = await getMatchCollection()

      // Check if match already exists
      const existingMatch = await matchCollection.findOne({
        users: { $all: sortedUsers, $size: 2 }
      })

      if (existingMatch) {
        socket.emit('live-call-match-promoted', { matchId: existingMatch._id.toHexString() })
        return
      }

      // Create new match
      const newMatch: DbMatch = {
        users: sortedUsers,
        stage: 'unlocked', // Promoted matches start at unlocked (Stage 3)
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        createdBy: userId,
        updatedBy: userId,
      }

      const result = await matchCollection.insertOne(newMatch)
      const matchId = result.insertedId.toHexString()

      // Notify both users
      io.to(`user:${userId}`).emit('live-call-match-promoted', { matchId })
      io.to(`user:${partnerId}`).emit('live-call-match-promoted', { matchId })

      // Trigger contact exchange reveal
      await triggerContactExchange(io, matchId, sortedUsers)

      console.log(`🤝 [LiveCall] Match promoted to formal: ${matchId}`)
    } catch (error) {
      console.error('Error promoting live call match:', error)
      socket.emit('live-call-error', { message: 'Failed to promote match' })
    } finally {
      promotionLocks.delete(lockKey)
    }
  })

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    liveCallQueueService.leaveQueue(userId)
    busyStateService.clearUserStatus(userId)
  })
}
