import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { liveCallQueueService } from '../services/live-call-queue.service'
import { getUserCollection, getMatchCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'
import { LOOKING_FOR, USER_GENDER, UserPreferences } from '@shared/types'
import { DbMatch } from '@/data/db/types/match'
import { randomUUID } from 'crypto'
import { triggerContactExchange } from './staged-call.handler'
import { busyStateService } from '../services/busy-state.service'

import { circuitBreaker } from '@/utils/circuit-breaker'

const MAX_QUEUE_SIZE = 1000
const promotionLocks = new Set<string>()
const joiningLocks = new Set<string>()

/**
 * Register live call socket event handlers
 */
export const registerLiveCallHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  /**
   * Join the live call queue
   */
  socket.on('live-call-join', async () => {
    if (joiningLocks.has(userId)) return
    
    try {
      joiningLocks.add(userId)
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

      const gender = (user.profile?.gender as USER_GENDER | undefined) ?? USER_GENDER.OTHER
      const age = user.profile?.age ?? 18
      const preferences = (user.preferences as UserPreferences | undefined) ?? {
        lookingFor: LOOKING_FOR.ALL,
        ageRange: 200,
      }

      if (liveCallQueueService.getQueueSize() >= MAX_QUEUE_SIZE) {
        socket.emit('live-call-error', { message: 'Queue is full, please try again later' })
        return
      }

      const match = liveCallQueueService.joinQueue({
        userId,
        gender,
        age,
        preferences,
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
      } else {
        busyStateService.setUserStatus(userId, 'queueing')
        socket.emit('live-call-queued')
      }
    } catch (error) {
      console.error('Error joining live call queue:', error)
      socket.emit('live-call-error', { message: 'Internal server error' })
    } finally {
      joiningLocks.delete(userId)
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
    } catch (error) {
      console.error('Error leaving live call queue:', error)
    }
  })

  /**
   * Cancel live call (explicit user cancellation)
   */
  socket.on('live-call-cancel', (data: { status: string }) => {
    try {
      const { status } = data
      
      // Get partner if user was connecting
      const partnerId = liveCallQueueService.getPartner(userId)
      
      // Remove from queue and clear connecting state
      liveCallQueueService.leaveQueue(userId)
      liveCallQueueService.clearConnecting(userId)
      busyStateService.clearUserStatus(userId)
      
      // If user was connecting, notify the partner
      if (status === 'connecting' && partnerId) {
        io.to(`user:${partnerId}`).emit('live-call-cancelled')
        busyStateService.clearUserStatus(partnerId)
        liveCallQueueService.clearConnecting(partnerId)
      }
      
      socket.emit('live-call-left')
      console.log(`🚫 [LiveCall] User ${userId} cancelled (status: ${status})`)
    } catch (error) {
      console.error('Error cancelling live call:', error)
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
    const userStatus = busyStateService.getUserStatus(userId)
    
    // If user was connecting, notify partner about disconnection
    if (userStatus === 'connecting' || userStatus === 'queueing') {
      const partnerId = liveCallQueueService.getPartner(userId)
      
      if (partnerId) {
        io.to(`user:${partnerId}`).emit('live-call-cancelled')
        busyStateService.clearUserStatus(partnerId)
        liveCallQueueService.clearConnecting(partnerId)
        console.log(`🔌 [LiveCall] User ${userId} disconnected, notified partner ${partnerId}`)
      }
    }
    
    liveCallQueueService.leaveQueue(userId)
    liveCallQueueService.clearConnecting(userId)
    busyStateService.clearUserStatus(userId)
  })
}
